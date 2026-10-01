/**
 * Stripe Service
 *
 * Thin wrapper around the Stripe SDK.
 * Exists for two reasons:
 *  1. Centralizes Stripe config (single source of truth)
 *  2. Makes mocking trivial in unit tests
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new InternalServerErrorException('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20' as any,
    });

    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  /**
   * Create a payment intent.
   * @param amountInCents — amount in the smallest currency unit (e.g., cents for USD)
   * @param currency — currency code (e.g., 'usd')
   * @param metadata — extra data to attach (e.g., orderId, userId)
   */
  async createPaymentIntent(
    amountInCents: number,
    currency: string,
    metadata: Record<string, string> = {}
  ) {
    return this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });
  }

  /**
   * Retrieve a payment intent by ID.
   */
  async retrievePaymentIntent(paymentIntentId: string) {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Create a refund.
   * @param paymentIntentId — the payment intent to refund
   * @param amountInCents — optional partial amount in cents (omit for full refund)
   */
  async createRefund(paymentIntentId: string, amountInCents?: number) {
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amountInCents !== undefined && { amount: amountInCents }),
    });
  }

  /**
   * Verify and parse a webhook event from Stripe.
   * Throws if the signature doesn't match.
   */
  constructWebhookEvent(payload: Buffer | string, signature: string): Stripe.Event {
    if (!this.webhookSecret) {
      throw new InternalServerErrorException('STRIPE_WEBHOOK_SECRET is not configured');
    }
    return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
  }
}
