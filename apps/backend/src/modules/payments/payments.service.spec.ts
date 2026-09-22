/**
 * Payments Service Tests
 *
 * Unit tests for PaymentsService covering:
 * - Payment intent creation
 * - Webhook handling
 * - Refunds
 * - Currency conversion
 * - Ownership checks
 *
 * All Stripe and Prisma calls are mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, PaymentMethod } from '@prisma/client';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockUserId = 'user-uuid-123';
  const mockOtherUserId = 'other-user-uuid-456';
  const mockOrderId = 'order-uuid-789';
  const mockPaymentIntentId = 'pi_test_123';

  const mockOrder = {
    id: mockOrderId,
    orderNumber: 'ORD-2026-00001',
    userId: mockUserId,
    subtotal: 91998,
    tax: 0,
    shippingCost: 250,
    total: 92248,
    status: OrderStatus.PENDING,
    shippingAddress: '123 Test St',
    paymentId: null,
    paymentMethod: null,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // ============ MOCK PRISMA ============
  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  // ============ MOCK STRIPE ============
  const mockStripeService = {
    createPaymentIntent: jest.fn(),
    retrievePaymentIntent: jest.fn(),
    createRefund: jest.fn(),
    constructWebhookEvent: jest.fn(),
  };

  // ============ MOCK CONFIG ============
  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'STRIPE_KES_TO_USD_RATE') return 0.0077;
      if (key === 'STRIPE_CURRENCY') return 'usd';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StripeService, useValue: mockStripeService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);

    jest.clearAllMocks();
  });

  // ============ CREATE PAYMENT INTENT TESTS ============

  describe('createPaymentIntent', () => {
    it('should create a payment intent and save ID to order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockStripeService.createPaymentIntent.mockResolvedValue({
        id: mockPaymentIntentId,
        client_secret: 'pi_test_123_secret_456',
        amount: 710,
        currency: 'usd',
        status: 'requires_payment_method',
      });
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        paymentId: mockPaymentIntentId,
        paymentMethod: PaymentMethod.STRIPE,
      });

      const result = await service.createPaymentIntent(mockUserId, {
        orderId: mockOrderId,
      });

      expect(mockStripeService.createPaymentIntent).toHaveBeenCalled();
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: {
          paymentId: mockPaymentIntentId,
          paymentMethod: PaymentMethod.STRIPE,
        },
      });
      expect(result.paymentIntentId).toBe(mockPaymentIntentId);
      expect(result.clientSecret).toBe('pi_test_123_secret_456');
    });

    it('should throw NotFoundException if order does not exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent(mockUserId, { orderId: mockOrderId })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.createPaymentIntent(mockOtherUserId, { orderId: mockOrderId })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order is not PENDING', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      });

      await expect(
        service.createPaymentIntent(mockUserId, { orderId: mockOrderId })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if order already has a payment intent', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        paymentId: 'pi_existing',
      });

      await expect(
        service.createPaymentIntent(mockUserId, { orderId: mockOrderId })
      ).rejects.toThrow(BadRequestException);
    });

    it('should convert KES to USD cents correctly', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockStripeService.createPaymentIntent.mockResolvedValue({
        id: mockPaymentIntentId,
        client_secret: 'secret',
        amount: 0,
        currency: 'usd',
        status: 'requires_payment_method',
      });
      mockPrismaService.order.update.mockResolvedValue(mockOrder);

      await service.createPaymentIntent(mockUserId, { orderId: mockOrderId });

      // order.total = 92248 KES
      // 92248 * 0.0077 = 710.3096 USD
      // 710.3096 * 100 = 71030.96 cents
      // Round to: 71031 cents
      const callArgs = mockStripeService.createPaymentIntent.mock.calls[0];
      expect(callArgs[0]).toBe(71031);
      expect(callArgs[1]).toBe('usd');
    });
  });

  // ============ WEBHOOK TESTS ============

  describe('handleWebhook', () => {
    it('should throw BadRequestException on invalid signature', async () => {
      mockStripeService.constructWebhookEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(service.handleWebhook(Buffer.from('payload'), 'bad-sig')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should route payment_intent.succeeded events', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue({
        id: 'evt_test',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: mockPaymentIntentId,
            metadata: { orderId: mockOrderId },
          },
        },
      });
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      });

      const result = await service.handleWebhook(Buffer.from('payload'), 'sig');

      expect(result).toEqual({ received: true });
      expect(mockPrismaService.order.update).toHaveBeenCalled();
    });

    it('should route payment_intent.payment_failed events (no update)', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue({
        id: 'evt_test',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: mockPaymentIntentId,
            metadata: { orderId: mockOrderId },
          },
        },
      });
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.handleWebhook(Buffer.from('payload'), 'sig');

      expect(result).toEqual({ received: true });
      // Should NOT update — payment failed
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });

    it('should ignore unhandled event types', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue({
        id: 'evt_test',
        type: 'customer.created',
        data: { object: {} },
      });

      const result = await service.handleWebhook(Buffer.from('payload'), 'sig');

      expect(result).toEqual({ received: true });
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });
  });

  // ============ PAYMENT SUCCEEDED TESTS ============

  describe('handlePaymentSucceeded (via webhook)', () => {
    it('should mark order as PAID', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: mockPaymentIntentId,
            metadata: { orderId: mockOrderId },
          },
        },
      });
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
        paidAt: new Date(),
      });

      await service.handleWebhook(Buffer.from('payload'), 'sig');

      const updateCall = mockPrismaService.order.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe(OrderStatus.PAID);
      expect(updateCall.data.paidAt).toBeInstanceOf(Date);
    });

    it('should be idempotent if order is already PAID', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: mockPaymentIntentId,
            metadata: { orderId: mockOrderId },
          },
        },
      });
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      });

      await service.handleWebhook(Buffer.from('payload'), 'sig');

      // Should NOT update — already PAID
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });
  });

  // ============ REFUND TESTS ============

  describe('refund', () => {
    it('should throw NotFoundException if order does not exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.refund({ orderId: mockOrderId })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order is not PAID or SHIPPED', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder); // PENDING

      await expect(service.refund({ orderId: mockOrderId })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if order has no payment', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
        paymentId: null,
      });

      await expect(service.refund({ orderId: mockOrderId })).rejects.toThrow(BadRequestException);
    });

    it('should issue a full refund when amount is omitted', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
        paymentId: mockPaymentIntentId,
      });
      mockStripeService.createRefund.mockResolvedValue({
        id: 're_test',
        amount: 71031,
        currency: 'usd',
        status: 'succeeded',
      });
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.refund({ orderId: mockOrderId });

      expect(mockStripeService.createRefund).toHaveBeenCalledWith(mockPaymentIntentId, undefined);
      expect(result.refundId).toBe('re_test');
    });

    it('should issue a partial refund when amount is provided', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
        paymentId: mockPaymentIntentId,
      });
      mockStripeService.createRefund.mockResolvedValue({
        id: 're_test',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
      });

      const result = await service.refund({
        orderId: mockOrderId,
        amount: 10000, // 10000 KES partial refund
      });

      const callArgs = mockStripeService.createRefund.mock.calls[0];
      expect(callArgs[1]).toBeDefined(); // partial amount in cents
      expect(callArgs[1]).toBeGreaterThan(0);
      expect(result.refundId).toBe('re_test');
    });

    it('should throw BadRequestException if refund amount exceeds order total', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
        paymentId: mockPaymentIntentId,
      });

      await expect(
        service.refund({
          orderId: mockOrderId,
          amount: 999999, // way more than order total
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============ GET PAYMENT INFO TESTS ============

  describe('getPaymentInfo', () => {
    it('should return safe payment info for owner', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getPaymentInfo(mockUserId, mockOrderId);

      expect(result).toEqual({
        orderId: mockOrder.id,
        orderNumber: mockOrder.orderNumber,
        status: mockOrder.status,
        paymentMethod: mockOrder.paymentMethod,
        totalInKes: Number(mockOrder.total),
        paidAt: mockOrder.paidAt,
      });
    });

    it('should throw ForbiddenException for non-owner', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.getPaymentInfo(mockOtherUserId, mockOrderId)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.getPaymentInfo(mockUserId, 'nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
