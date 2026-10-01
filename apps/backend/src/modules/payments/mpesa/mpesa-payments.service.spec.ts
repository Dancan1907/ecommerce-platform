/**
 * MpesaPaymentsService Tests
 *
 * Unit tests for M-Pesa payment orchestration.
 * Mocks PrismaService and MpesaService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { MpesaPaymentsService } from './mpesa-payments.service';
import { MpesaService } from './mpesa.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { OrderStatus, PaymentMethod } from '@prisma/client';

describe('MpesaPaymentsService', () => {
  let service: MpesaPaymentsService;

  const mockUserId = 'user-uuid-123';
  const mockOtherUserId = 'other-user-uuid';
  const mockOrderId = 'order-uuid-789';
  const mockCheckoutRequestId = 'ws_CO_test_123';

  const mockOrder = {
    id: mockOrderId,
    orderNumber: 'ORD-2026-00001',
    userId: mockUserId,
    total: 92248,
    status: OrderStatus.PENDING,
    paymentId: null,
    paymentMethod: null,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockMpesaService = {
    initiateStkPush: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MpesaPaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MpesaService, useValue: mockMpesaService },
      ],
    }).compile();

    service = module.get<MpesaPaymentsService>(MpesaPaymentsService);
    jest.clearAllMocks();
  });

  // ============ INITIATE STK PUSH ============

  describe('initiateStkPush', () => {
    it('should initiate an STK Push successfully', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockMpesaService.initiateStkPush.mockResolvedValue({
        MerchantRequestID: 'merchant-1',
        CheckoutRequestID: mockCheckoutRequestId,
        ResponseCode: '0',
        ResponseDescription: 'Success',
        CustomerMessage: 'Success',
      });
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        paymentId: mockCheckoutRequestId,
        paymentMethod: PaymentMethod.MPESA,
      });

      const result = await service.initiateStkPush(mockUserId, {
        orderId: mockOrderId,
        phoneNumber: '254708374149',
      });

      expect(mockMpesaService.initiateStkPush).toHaveBeenCalledWith(
        '254708374149',
        92248,
        'ORD-2026-00001',
        'Order payment'
      );
      expect(result.checkoutRequestId).toBe(mockCheckoutRequestId);
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: {
          paymentId: mockCheckoutRequestId,
          paymentMethod: PaymentMethod.MPESA,
        },
      });
    });

    it('should throw NotFoundException if order does not exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.initiateStkPush(mockUserId, {
          orderId: 'nonexistent',
          phoneNumber: '254708374149',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.initiateStkPush(mockOtherUserId, {
          orderId: mockOrderId,
          phoneNumber: '254708374149',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order is not PENDING', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      });

      await expect(
        service.initiateStkPush(mockUserId, {
          orderId: mockOrderId,
          phoneNumber: '254708374149',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============ HANDLE CALLBACK ============

  describe('handleCallback', () => {
    it('should mark order PAID on success callback', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
        paidAt: new Date(),
      });

      const result = await service.handleCallback({
        Body: {
          stkCallback: {
            MerchantRequestID: 'merchant-1',
            CheckoutRequestID: mockCheckoutRequestId,
            ResultCode: 0,
            ResultDesc: 'Success',
            CallbackMetadata: {
              Item: [
                { Name: 'MpesaReceiptNumber', Value: 'RECEIPT123' },
                { Name: 'Amount', Value: 92248 },
                { Name: 'PhoneNumber', Value: 254708374149 },
              ],
            },
          },
        },
      });

      expect(result).toEqual({ ResultCode: 0, ResultDesc: 'Accepted' });
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: {
          status: OrderStatus.PAID,
          paidAt: expect.any(Date),
        },
      });
    });

    it('should leave order PENDING on failure callback', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue(mockOrder);

      const result = await service.handleCallback({
        Body: {
          stkCallback: {
            MerchantRequestID: 'merchant-1',
            CheckoutRequestID: mockCheckoutRequestId,
            ResultCode: 1032,
            ResultDesc: 'Request cancelled by user',
          },
        },
      });

      expect(result).toEqual({ ResultCode: 0, ResultDesc: 'Accepted' });
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });

    it('should be idempotent if order is already PAID', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      });

      const result = await service.handleCallback({
        Body: {
          stkCallback: {
            MerchantRequestID: 'merchant-1',
            CheckoutRequestID: mockCheckoutRequestId,
            ResultCode: 0,
            ResultDesc: 'Success',
          },
        },
      });

      expect(result).toEqual({ ResultCode: 0, ResultDesc: 'Accepted' });
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });

    it('should return 200 on malformed callback', async () => {
      const result = await service.handleCallback({} as any);

      expect(result).toEqual({ ResultCode: 0, ResultDesc: 'Accepted' });
    });

    it('should return 200 if order not found for CheckoutRequestID', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      const result = await service.handleCallback({
        Body: {
          stkCallback: {
            MerchantRequestID: 'merchant-1',
            CheckoutRequestID: 'nonexistent',
            ResultCode: 0,
            ResultDesc: 'Success',
          },
        },
      });

      expect(result).toEqual({ ResultCode: 0, ResultDesc: 'Accepted' });
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });

    it('should extract receipt metadata correctly', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      });

      await service.handleCallback({
        Body: {
          stkCallback: {
            MerchantRequestID: 'merchant-1',
            CheckoutRequestID: mockCheckoutRequestId,
            ResultCode: 0,
            ResultDesc: 'Success',
            CallbackMetadata: {
              Item: [
                { Name: 'MpesaReceiptNumber', Value: 'RECEIPT123' },
                { Name: 'Amount', Value: 92248 },
                { Name: 'PhoneNumber', Value: 254708374149 },
              ],
            },
          },
        },
      });

      // No exception thrown = parsing worked
      expect(mockPrismaService.order.update).toHaveBeenCalled();
    });
  });

  // ============ GET PAYMENT INFO ============

  describe('getPaymentInfo', () => {
    it('should return safe payment info for owner', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getPaymentInfo(mockUserId, mockOrderId);

      expect(result).toEqual(
        expect.objectContaining({
          orderId: mockOrder.id,
          orderNumber: mockOrder.orderNumber,
          status: mockOrder.status,
        })
      );
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
