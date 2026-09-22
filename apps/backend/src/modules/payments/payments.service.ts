/**
 * Payments Service
 *
 * Orchestrates payment operations between:
 *  - Our orders (source of truth for amounts)
 *  - Stripe (payment processor)
 *  - Currency conversion (KES → USD)
 *
 * Handles:
 *  - Creating payment intents for orders
 *  - Processing Stripe webhooks to mark orders paid
 *  - Admin-initiated refunds
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { kesToStripeCents } from './utils/currency.util';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Create a Stripe Payment Intent for an order.
   *
   * Flow:
   *  1. Find the order (must belong to user, unless admin)
   *  2. Verify order is PENDING and has no existing payment
   *  3. Convert KES total to USD cents
   *  4. Create a Stripe payment intent with orderId + userId metadata
   *  5. Save the paymentIntentId to the order
   *  6. Return clientSecret + intent details for frontend
   */
  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    const { orderId } = dto;

    // 1. Fetch the order with ownership check
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You can only pay for your own orders');
    }

    // 2. Validate order state
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order is already ${order.status.toLowerCase()}; cannot create payment`
      );
    }

    if (order.paymentId) {
      throw new BadRequestException('Order already has a payment intent');
    }

    // 3. Convert KES to USD cents
    const rate = this.configService.get<number>('STRIPE_KES_TO_USD_RATE', 0.0077);
    const currency = this.configService.get<string>('STRIPE_CURRENCY', 'usd');
    const amountInCents = kesToStripeCents(Number(order.total), rate);

    // 4. Create the payment intent
    const paymentIntent = await this.stripe.createPaymentIntent(amountInCents, currency, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
    });

    // 5. Save payment intent ID to order + set method to STRIPE
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: paymentIntent.id,
        paymentMethod: PaymentMethod.STRIPE,
      },
    });

    // 6. Return the client secret for frontend
    this.logger.log(
      `Payment intent ${paymentIntent.id} created for order ${order.orderNumber} (${amountInCents} ${currency})`
    );

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };
  }

  /**
   * Handle Stripe webhook events.
   *
   * Called by Stripe for events like payment_intent.succeeded/failed.
   * Verifies the signature, then updates the order accordingly.
   *
   * Idempotency: If the order is already PAID, we skip (safe to retry).
   */
  async handleWebhook(payload: Buffer | string, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.constructWebhookEvent(payload, signature);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Received webhook: ${event.type} (id: ${event.id})`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Handle payment_intent.succeeded.
   * Marks the order PAID and records the paidAt timestamp.
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
      this.logger.warn(`Payment intent ${paymentIntent.id} has no orderId metadata`);
      return;
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      this.logger.warn(`Order ${orderId} not found for payment ${paymentIntent.id}`);
      return;
    }

    // Idempotency: skip if already PAID
    if (order.status === OrderStatus.PAID) {
      this.logger.log(`Order ${order.orderNumber} already PAID; skipping`);
      return;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
      },
    });

    this.logger.log(`Order ${order.orderNumber} marked PAID via Stripe intent ${paymentIntent.id}`);
  }

  /**
   * Handle payment_intent.payment_failed.
   * Logs the failure. Order remains PENDING so the user can retry.
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) return;

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    this.logger.warn(`Payment failed for order ${order.orderNumber} (intent ${paymentIntent.id})`);
    // Order stays PENDING — the user can retry with a new payment intent
  }

  /**
   * Process a refund (ADMIN only).
   *
   * Rules:
   *  - Order must be PAID or SHIPPED (can't refund unpaid or already-cancelled)
   *  - Stripe refund is issued first (source of truth)
   *  - Order is then marked CANCELLED (or REFUNDED if we add that enum later)
   *
   * For MVP, we cancel the order and record the refund reason in the log.
   */
  async refund(dto: RefundPaymentDto) {
    const { orderId, amount, reason } = dto;

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException(`Cannot refund an order with status ${order.status}`);
    }

    if (!order.paymentId) {
      throw new BadRequestException('Order has no payment to refund');
    }

    // Convert refund amount to cents (if partial)
    let refundAmountInCents: number | undefined;
    if (amount !== undefined) {
      const rate = this.configService.get<number>('STRIPE_KES_TO_USD_RATE', 0.0077);
      refundAmountInCents = kesToStripeCents(amount, rate);

      if (refundAmountInCents > kesToStripeCents(Number(order.total), rate)) {
        throw new BadRequestException('Refund amount exceeds order total');
      }
    }

    // Issue the refund in Stripe
    const refund = await this.stripe.createRefund(order.paymentId, refundAmountInCents);

    this.logger.log(
      `Refund ${refund.id} issued for order ${order.orderNumber} (${
        amount ?? 'full'
      }${reason ? ` — ${reason}` : ''})`
    );

    // Mark order CANCELLED (full refund only, MVP)
    if (amount === undefined) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });
    }

    return {
      refundId: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
    };
  }

  /**
   * Get public-safe payment info for an order (for frontend display).
   * Never returns the clientSecret — only summary info.
   */
  async getPaymentInfo(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('You can only view your own payment info');
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      totalInKes: Number(order.total),
      paidAt: order.paidAt,
    };
  }
}
