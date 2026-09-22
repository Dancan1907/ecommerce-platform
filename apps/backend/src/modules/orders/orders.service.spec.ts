/**
 * Orders Service Tests
 *
 * Unit tests for OrdersService covering:
 * - Order creation from cart (atomic transaction)
 * - Order retrieval (user + admin)
 * - Status transitions
 * - Order cancellation with stock restore
 * - Pagination and totals
 *
 * All Prisma calls are mocked — no real database access.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

// Mock the order number generator to make tests deterministic
jest.mock('./utils/order-number.generator', () => ({
  generateOrderNumber: jest.fn().mockResolvedValue('ORD-2026-00001'),
}));

describe('OrdersService', () => {
  let service: OrdersService;

  // ============ MOCK DATA ============
  const mockUserId = 'user-uuid-123';
  const mockAdminId = 'admin-uuid-456';
  const mockOtherUserId = 'other-user-uuid-789';
  const mockOrderId = 'order-uuid-001';
  const mockCartId = 'cart-uuid-001';
  const mockProductId = 'prod-uuid-001';

  const mockProduct = {
    id: mockProductId,
    name: 'Sony Headphones',
    slug: 'sony-headphones',
    sku: 'SONY-WH1000XM5',
    price: 45999,
    stockQuantity: 10,
    isActive: true,
  };

  const mockCartItem = {
    id: 'cart-item-1',
    cartId: mockCartId,
    productId: mockProductId,
    quantity: 2,
    product: mockProduct,
  };

  const mockCart = {
    id: mockCartId,
    userId: mockUserId,
    items: [mockCartItem],
  };

  const mockOrderItem = {
    id: 'order-item-1',
    orderId: mockOrderId,
    productName: mockProduct.name,
    productSku: mockProduct.sku,
    price: mockProduct.price,
    quantity: 2,
    subtotal: 91998,
  };

  const mockOrder = {
    id: mockOrderId,
    orderNumber: 'ORD-2026-00001',
    userId: mockUserId,
    subtotal: 91998,
    tax: 0,
    shippingCost: 250,
    total: 92248,
    status: OrderStatus.PENDING,
    shippingAddress: '123 Test St, Nairobi',
    paymentId: null,
    paymentMethod: 'STRIPE',
    paidAt: null,
    shippedAt: null,
    deliveredAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [mockOrderItem],
  };

  // ============ MOCK PRISMA ============
  const mockPrismaService = {
    $transaction: jest.fn(),
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    cart: {
      findUnique: jest.fn(),
    },
    cartItem: {
      deleteMany: jest.fn(),
    },
    product: {
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<OrdersService>(OrdersService);

    // Make $transaction execute the callback with the same mock
    mockPrismaService.$transaction.mockImplementation(async (cb: any) => cb(mockPrismaService));

    jest.clearAllMocks();
  });

  // ============ CREATE ORDER TESTS ============

  describe('create', () => {
    const createDto = {
      shippingAddress: '123 Test St, Nairobi',
      paymentMethod: 'STRIPE',
    };

    it('should create an order from the cart', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.product.update.mockResolvedValue({});
      mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.create(mockUserId, createDto);

      expect(result).toEqual(mockOrder);
      expect(mockPrismaService.order.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if cart is empty', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: mockCartId,
        userId: mockUserId,
        items: [],
      });

      await expect(service.create(mockUserId, createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if cart does not exist', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);

      await expect(service.create(mockUserId, createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if product is inactive', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        ...mockCart,
        items: [{ ...mockCartItem, product: { ...mockProduct, isActive: false } }],
      });

      await expect(service.create(mockUserId, createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if quantity exceeds stock', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        ...mockCart,
        items: [{ ...mockCartItem, quantity: 999, product: { ...mockProduct, stockQuantity: 10 } }],
      });

      await expect(service.create(mockUserId, createDto)).rejects.toThrow(BadRequestException);
    });

    it('should generate an order number in ORD-YYYY-NNNNN format', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.product.update.mockResolvedValue({});
      mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      await service.create(mockUserId, createDto);

      const callArg = mockPrismaService.order.create.mock.calls[0][0];
      expect(callArg.data.orderNumber).toBe('ORD-2026-00001');
    });

    it('should snapshot product name, SKU, and price into OrderItem', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.product.update.mockResolvedValue({});
      mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      await service.create(mockUserId, createDto);

      const callArg = mockPrismaService.order.create.mock.calls[0][0];
      expect(callArg.data.items.create[0]).toEqual(
        expect.objectContaining({
          productName: mockProduct.name,
          productSku: mockProduct.sku,
          price: mockProduct.price,
          quantity: 2,
          subtotal: 91998,
        })
      );
    });

    it('should decrement stock for each product', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.product.update.mockResolvedValue({});
      mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      await service.create(mockUserId, createDto);

      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: mockProductId },
        data: { stockQuantity: { decrement: 2 } },
      });
    });

    it('should clear the cart after order creation', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.product.update.mockResolvedValue({});
      mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      await service.create(mockUserId, createDto);

      expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: mockCartId },
      });
    });

    it('should compute totals with shipping (subtotal + shipping + 0 tax)', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.product.update.mockResolvedValue({});
      mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      await service.create(mockUserId, createDto);

      const callArg = mockPrismaService.order.create.mock.calls[0][0];
      expect(callArg.data.subtotal).toBe(91998); // 45999 * 2
      expect(callArg.data.tax).toBe(0);
      expect(callArg.data.shippingCost).toBe(250);
      expect(callArg.data.total).toBe(92248); // 91998 + 250
    });
  });

  // ============ FIND USER ORDERS TESTS ============

  describe('findUserOrders', () => {
    it('should return paginated orders for user', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);
      mockPrismaService.order.count.mockResolvedValue(1);

      const result = await service.findUserOrders(mockUserId, {});

      expect(result.data).toEqual([mockOrder]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should apply status filter', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);
      mockPrismaService.order.count.mockResolvedValue(1);

      await service.findUserOrders(mockUserId, { status: OrderStatus.PENDING });

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            status: OrderStatus.PENDING,
          }),
        })
      );
    });

    it('should compute pagination correctly', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);
      mockPrismaService.order.count.mockResolvedValue(45);

      const result = await service.findUserOrders(mockUserId, { page: 3, limit: 10 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5); // ceil(45 / 10)
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 })
      );
    });
  });

  // ============ FIND ONE TESTS ============

  describe('findOne', () => {
    it('should return order for the owner', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOne(mockOrderId, mockUserId, false);

      expect(result).toEqual(mockOrder);
    });

    it('should allow admin to view any order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOne(mockOrderId, mockAdminId, true);

      expect(result).toEqual(mockOrder);
    });

    it('should throw ForbiddenException for non-owner non-admin', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.findOne(mockOrderId, mockOtherUserId, false)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', mockUserId, false)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ============ FIND ALL ADMIN TESTS ============

  describe('findAllAdmin', () => {
    it('should return all orders (paginated)', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);
      mockPrismaService.order.count.mockResolvedValue(1);

      const result = await service.findAllAdmin({});

      expect(result.data).toEqual([mockOrder]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  // ============ UPDATE STATUS TESTS ============

  describe('updateStatus', () => {
    it('should transition PENDING → PAID and set paidAt', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
        paidAt: new Date(),
      });

      const result = await service.updateStatus(mockOrderId, { status: OrderStatus.PAID });

      expect(result.status).toBe(OrderStatus.PAID);
      const callArg = mockPrismaService.order.update.mock.calls[0][0];
      expect(callArg.data.status).toBe(OrderStatus.PAID);
      expect(callArg.data.paidAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException on invalid transition', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      });

      await expect(
        service.updateStatus(mockOrderId, { status: OrderStatus.DELIVERED })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', { status: OrderStatus.PAID })
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============ CANCEL TESTS ============

  describe('cancel', () => {
    it('should cancel a PENDING order and restore stock', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.product.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.cancel(mockOrderId, mockUserId, false);

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(mockPrismaService.product.updateMany).toHaveBeenCalledWith({
        where: { sku: mockProduct.sku },
        data: { stockQuantity: { increment: 2 } },
      });
    });

    it('should throw ForbiddenException for non-owner non-admin', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.cancel(mockOrderId, mockOtherUserId, false)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw BadRequestException if order is SHIPPED', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.SHIPPED,
      });

      await expect(service.cancel(mockOrderId, mockUserId, false)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if order is already CANCELLED', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      await expect(service.cancel(mockOrderId, mockUserId, false)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
