/**
 * M-Pesa Payments Service
 *
 * Orchestrates M-Pesa payments between orders and Daraja API.
 *
 * Flow:
 *  1. User requests STK Push for an order
 *  2. We validate order ownership + state
 *  3. We call MpesaService.initiateStkPush()
 *  4. Safaricom sends USSD prompt to user's phone
 *  5. User enters PIN
 *  6. Safaricom calls our callback with result
 *  7. We mark order PAID (on success) or log failure
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MpesaService } from './mpesa.service';
import { StkPushDto } from './dto/stk-push.dto';
import { MpesaCallbackDto } from './dto/mpesa-callback.dto';
import { OrderStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class MpesaPaymentsService {
  private readonly logger = new Logger(MpesaPaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mpesa: MpesaService
  ) {}

  /**
   * Initiate an STK Push for an order.
   */
  async initiateStkPush(userId: string, dto: StkPushDto) {
    const { orderId, phoneNumber } = dto;

    // 1. Fetch order with ownership check
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
        `Order is already ${order.status.toLowerCase()}; cannot initiate payment`
      );
    }

    // 3. Call Daraja to initiate STK Push
    const amount = Math.floor(Number(order.total)); // M-Pesa: integer KES

    const response = await this.mpesa.initiateStkPush(
      phoneNumber,
      amount,
      order.orderNumber,
      'Order payment'
    );

    // 4. Save the CheckoutRequestID on the order for callback matching
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: response.CheckoutRequestID,
        paymentMethod: PaymentMethod.MPESA,
      },
    });

    this.logger.log(
      `STK Push accepted for order ${order.orderNumber} (CheckoutRequestID: ${response.CheckoutRequestID})`
    );

    return {
      checkoutRequestId: response.CheckoutRequestID,
      merchantRequestId: response.MerchantRequestID,
      responseCode: response.ResponseCode,
      responseDescription: response.ResponseDescription,
      customerMessage: response.CustomerMessage,
      amount,
      orderNumber: order.orderNumber,
    };
  }

  /**
   * Handle Safaricom's callback after STK Push completes.
   *
   * The callback arrives with:
   *  - CheckoutRequestID (matches order.paymentId)
   *  - ResultCode: 0 = success, anything else = failure
   *  - CallbackMetadata (only on success): MpesaReceiptNumber, Amount, PhoneNumber
   *
   * IMPORTANT: Always respond with ResultCode: 0 to acknowledge receipt.
   * Otherwise Safaricom will retry the callback.
   */
  async handleCallback(dto: MpesaCallbackDto) {
    const stk = dto?.Body?.stkCallback;
    if (!stk) {
      this.logger.warn('Received malformed M-Pesa callback');
      return { ResultCode: 0, ResultDesc: 'Accepted' };
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stk;

    this.logger.log(
      `M-Pesa callback: CheckoutRequestID=${CheckoutRequestID}, ResultCode=${ResultCode}, Desc=${ResultDesc}`
    );

    // Find the order by CheckoutRequestID (which we saved as paymentId)
    const order = await this.prisma.order.findFirst({
      where: { paymentId: CheckoutRequestID },
    });

    if (!order) {
      this.logger.warn(`Order not found for CheckoutRequestID: ${CheckoutRequestID}`);
      return { ResultCode: 0, ResultDesc: 'Accepted' };
    }

    // Idempotency: if already PAID, skip
    if (order.status === OrderStatus.PAID) {
      this.logger.log(`Order ${order.orderNumber} already PAID; skipping`);
      return { ResultCode: 0, ResultDesc: 'Accepted' };
    }

    if (ResultCode === 0) {
      // SUCCESS
      const metadata = this.extractMetadata(CallbackMetadata);
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
        },
      });

      this.logger.log(
        `Order ${order.orderNumber} marked PAID via M-Pesa. Receipt: ${metadata.mpesaReceiptNumber}, Amount: ${metadata.amount}`
      );
    } else {
      // FAILURE — order stays PENDING; user can retry
      this.logger.warn(
        `M-Pesa payment failed for order ${order.orderNumber}: ${ResultDesc} (code ${ResultCode})`
      );
    }

    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  /**
   * Extract useful fields from Safaricom's CallbackMetadata.
   * Structure: { Item: [{ Name: 'MpesaReceiptNumber', Value: 'ABC123' }, ...] }
   */
  private extractMetadata(
    callbackMetadata?: MpesaCallbackDto['Body']['stkCallback']['CallbackMetadata']
  ) {
    const result: {
      mpesaReceiptNumber?: string;
      amount?: number;
      phoneNumber?: string;
    } = {};

    if (!callbackMetadata?.Item) return result;

    for (const item of callbackMetadata.Item) {
      if (item.Name === 'MpesaReceiptNumber') {
        result.mpesaReceiptNumber = String(item.Value);
      } else if (item.Name === 'Amount') {
        result.amount = Number(item.Value);
      } else if (item.Name === 'PhoneNumber') {
        result.phoneNumber = String(item.Value);
      }
    }

    return result;
  }

  /**
   * Get public-safe M-Pesa payment info for an order.
   */
  async getPaymentInfo(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

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
      checkoutRequestId: order.paymentMethod === PaymentMethod.MPESA ? order.paymentId : null,
    };
  }
}
