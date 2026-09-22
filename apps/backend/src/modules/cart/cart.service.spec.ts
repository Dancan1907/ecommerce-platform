/**
 * Cart Service Tests
 *
 * Unit tests for CartService covering:
 * - Cart initialization and retrieval
 * - Adding, updating, removing items
 * - Stock validation
 * - Cart validation before checkout
 * - Subtotal and item count calculations
 *
 * All Prisma calls are mocked — no real database access.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;

  // ============ MOCK DATA ============
  const mockUserId = 'user-uuid-123';
  const mockCartId = 'cart-uuid-456';
  const mockProductId1 = 'prod-uuid-1';
  const mockProductId2 = 'prod-uuid-2';

  const mockProduct1 = {
    id: mockProductId1,
    name: 'Sony Headphones',
    price: 45999,
    stockQuantity: 10,
    isActive: true,
    images: [{ id: 'img-1', url: '/uploads/products/sony.jpg', displayOrder: 0 }],
  };

  const mockProduct2 = {
    id: mockProductId2,
    name: 'Cotton T-Shirt',
    price: 2499,
    stockQuantity: 50,
    isActive: true,
    images: [],
  };

  const mockCartItem1 = {
    id: 'cart-item-1',
    cartId: mockCartId,
    productId: mockProductId1,
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: mockProduct1,
  };

  const mockCartItem2 = {
    id: 'cart-item-2',
    cartId: mockCartId,
    productId: mockProductId2,
    quantity: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    product: mockProduct2,
  };

  // ============ MOCK PRISMA ============
  const mockPrismaService = {
    cart: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    cartItem: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<CartService>(CartService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  // ============ GET CART TESTS ============

  describe('getCart', () => {
    it('should create a new cart if none exists', async () => {
      // No existing cart
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(null);
      // Create returns empty cart
      mockPrismaService.cart.create.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [],
      });

      const result = await service.getCart(mockUserId);

      expect(mockPrismaService.cart.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: mockUserId } })
      );
      expect(mockPrismaService.cart.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { userId: mockUserId } })
      );
      expect(result.items).toEqual([]);
      expect(result.subtotal).toBe(0);
      expect(result.itemCount).toBe(0);
    });

    it('should return existing cart with computed totals', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [mockCartItem1, mockCartItem2],
      });

      const result = await service.getCart(mockUserId);

      // Subtotal: (45999 * 2) + (2499 * 3) = 91998 + 7497 = 99495
      expect(result.subtotal).toBe(99495);
      // Item count: 2 + 3 = 5
      expect(result.itemCount).toBe(5);
      expect(mockPrismaService.cart.create).not.toHaveBeenCalled();
    });
  });

  // ============ ADD ITEM TESTS ============

  describe('addItem', () => {
    const emptyCart = {
      id: mockCartId,
      userId: mockUserId,
      items: [],
    };

    it('should add a new item to the cart', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct1);
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(emptyCart);
      mockPrismaService.cartItem.create.mockResolvedValueOnce(mockCartItem1);
      // Return cart with new item
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [mockCartItem1],
      });

      const result = await service.addItem(mockUserId, {
        productId: mockProductId1,
        quantity: 2,
      });

      expect(mockPrismaService.cartItem.create).toHaveBeenCalledWith({
        data: { cartId: mockCartId, productId: mockProductId1, quantity: 2 },
      });
      expect(result.items).toHaveLength(1);
    });

    it('should increment quantity if item already exists', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct1);
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [mockCartItem1], // already has qty 2
      });
      mockPrismaService.cartItem.update.mockResolvedValueOnce({
        ...mockCartItem1,
        quantity: 4,
      });
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [{ ...mockCartItem1, quantity: 4 }],
      });

      const result = await service.addItem(mockUserId, {
        productId: mockProductId1,
        quantity: 2,
      });

      expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith({
        where: { id: mockCartItem1.id },
        data: { quantity: 4 }, // 2 + 2
      });
      expect(mockPrismaService.cartItem.create).not.toHaveBeenCalled();
      expect(result.items[0].quantity).toBe(4);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.addItem(mockUserId, { productId: 'nonexistent', quantity: 1 })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if product is inactive', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce({
        ...mockProduct1,
        isActive: false,
      });

      await expect(
        service.addItem(mockUserId, { productId: mockProductId1, quantity: 1 })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if quantity exceeds stock', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct1); // stock = 10
      mockPrismaService.cart.findUnique.mockResolvedValueOnce(emptyCart);

      await expect(
        service.addItem(mockUserId, { productId: mockProductId1, quantity: 999 })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if cumulative quantity exceeds stock', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct1); // stock = 10
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [{ ...mockCartItem1, quantity: 8 }], // already has 8
      });

      // Try to add 5 more (8 + 5 = 13 > 10)
      await expect(
        service.addItem(mockUserId, { productId: mockProductId1, quantity: 5 })
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============ UPDATE ITEM TESTS ============

  describe('updateItem', () => {
    it('should update item quantity', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [mockCartItem1],
      });
      mockPrismaService.cartItem.update.mockResolvedValueOnce({
        ...mockCartItem1,
        quantity: 5,
      });
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [{ ...mockCartItem1, quantity: 5 }],
      });

      const result = await service.updateItem(mockUserId, mockProductId1, {
        quantity: 5,
      });

      expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith({
        where: { id: mockCartItem1.id },
        data: { quantity: 5 },
      });
      expect(result.items[0].quantity).toBe(5);
    });

    it('should throw NotFoundException if item not in cart', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [], // empty cart
      });

      await expect(service.updateItem(mockUserId, mockProductId1, { quantity: 1 })).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if new quantity exceeds stock', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [mockCartItem1], // product stock = 10
      });

      await expect(
        service.updateItem(mockUserId, mockProductId1, { quantity: 999 })
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============ REMOVE ITEM TESTS ============

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [mockCartItem1, mockCartItem2],
      });
      mockPrismaService.cartItem.delete.mockResolvedValueOnce(mockCartItem1);
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [mockCartItem2],
      });

      const result = await service.removeItem(mockUserId, mockProductId1);

      expect(mockPrismaService.cartItem.delete).toHaveBeenCalledWith({
        where: { id: mockCartItem1.id },
      });
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException if item not in cart', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [],
      });

      await expect(service.removeItem(mockUserId, mockProductId1)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ============ CLEAR CART TESTS ============

  describe('clearCart', () => {
    it('should delete all items from cart', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [mockCartItem1, mockCartItem2],
      });
      mockPrismaService.cartItem.deleteMany.mockResolvedValueOnce({ count: 2 });
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [],
      });

      const result = await service.clearCart(mockUserId);

      expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: mockCartId },
      });
      expect(result.items).toEqual([]);
      expect(result.itemCount).toBe(0);
    });
  });

  // ============ VALIDATE CART TESTS ============

  describe('validateCart', () => {
    it('should return valid=true for cart with in-stock items', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [mockCartItem1, mockCartItem2],
      });

      const result = await service.validateCart(mockUserId);

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.itemCount).toBe(5);
    });

    it('should return valid=false with "Cart is empty" for empty cart', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [],
      });

      const result = await service.validateCart(mockUserId);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Cart is empty');
    });

    it('should report issue if product is inactive', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [
          {
            ...mockCartItem1,
            product: { ...mockProduct1, isActive: false },
          },
        ],
      });

      const result = await service.validateCart(mockUserId);

      expect(result.valid).toBe(false);
      expect(result.issues).toEqual(
        expect.arrayContaining([expect.stringContaining('no longer available')])
      );
    });

    it('should report issue if quantity exceeds stock', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [
          {
            ...mockCartItem1,
            quantity: 999,
            product: { ...mockProduct1, stockQuantity: 10 },
          },
        ],
      });

      const result = await service.validateCart(mockUserId);

      expect(result.valid).toBe(false);
      expect(result.issues).toEqual(
        expect.arrayContaining([expect.stringContaining('only 10 unit(s)')])
      );
    });
  });

  // ============ COMPUTED TOTALS TESTS ============

  describe('computed totals', () => {
    it('should compute subtotal correctly for multiple items', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [mockCartItem1, mockCartItem2],
      });

      const result = await service.getCart(mockUserId);

      // (45999 * 2) + (2499 * 3) = 91998 + 7497 = 99495
      expect(result.subtotal).toBe(99495);
    });

    it('should compute item count correctly for multiple items', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValueOnce({
        id: mockCartId,
        userId: mockUserId,
        items: [mockCartItem1, mockCartItem2],
      });

      const result = await service.getCart(mockUserId);

      // 2 + 3 = 5
      expect(result.itemCount).toBe(5);
    });
  });
});
