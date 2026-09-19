/**
 * Products Service Tests
 *
 * Unit tests for ProductsService covering:
 * - Product CRUD (create, read, update, delete)
 * - Filters and pagination
 * - SKU and slug uniqueness
 * - Image management
 *
 * All Prisma calls are mocked — no real database access.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';

describe('ProductsService', () => {
  let service: ProductsService;

  // ============ MOCK DATA ============
  const mockCategoryId = 'cat-uuid-123';
  const mockSellerId = 'seller-uuid-456';
  const mockProductId = 'prod-uuid-789';

  const mockCategory = {
    id: mockCategoryId,
    name: 'Electronics',
    slug: 'electronics',
  };

  const mockSeller = {
    id: mockSellerId,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@ecommerce.com',
  };

  const mockProduct = {
    id: mockProductId,
    name: 'Sony Headphones',
    slug: 'sony-headphones',
    description: 'Premium noise-cancelling headphones',
    price: 45999,
    stockQuantity: 25,
    sku: 'SONY-WH1000XM5',
    isActive: true,
    categoryId: mockCategoryId,
    sellerId: mockSellerId,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [],
    category: mockCategory,
    seller: mockSeller,
  };

  // ============ MOCK PRISMA ============
  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    productImage: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ProductsService>(ProductsService);

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock fs.promises.unlink without replacing the whole fs module
    // (replacing fs breaks Prisma's internal fs.existsSync call)
    jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
  });

  // ============ CREATE TESTS ============

  describe('create', () => {
    const createDto = {
      name: 'Sony Headphones',
      description: 'Premium noise-cancelling headphones',
      price: 45999,
      stockQuantity: 25,
      sku: 'SONY-WH1000XM5',
      categoryId: mockCategoryId,
    };

    it('should create a product successfully', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(createDto, mockSellerId);

      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: mockCategoryId },
      });
      expect(mockPrismaService.product.create).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, mockSellerId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if SKU already exists', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct);

      await expect(service.create(createDto, mockSellerId)).rejects.toThrow(ConflictException);
    });

    it('should append suffix to slug if slug already exists', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(null) // SKU check passes
        .mockResolvedValueOnce(mockProduct); // Slug check fails
      mockPrismaService.product.create.mockResolvedValue({
        ...mockProduct,
        slug: 'sony-headphones-123456',
      });

      const result = await service.create(createDto, mockSellerId);

      expect(result.slug).toMatch(/sony-headphones-\d{6}/);
    });
  });

  // ============ FIND ALL TESTS ============

  describe('findAll', () => {
    it('should return paginated products with default page/limit', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: [mockProduct],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should apply categoryId filter', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);

      await service.findAll({ categoryId: mockCategoryId });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: mockCategoryId }),
        })
      );
    });

    it('should apply search filter across name and description', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);

      await service.findAll({ search: 'Sony' });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'Sony', mode: 'insensitive' } },
              { description: { contains: 'Sony', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should apply min and max price filters', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);

      await service.findAll({ minPrice: 1000, maxPrice: 50000 });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 1000, lte: 50000 },
          }),
        })
      );
    });

    it('should compute pagination correctly', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(45);

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
    });
  });

  // ============ FIND ONE TESTS ============

  describe('findOne', () => {
    it('should return product by ID with relations', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockProductId);

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: mockProductId } })
      );
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ============ FIND BY SLUG TESTS ============

  describe('findBySlug', () => {
    it('should return product by slug', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findBySlug('sony-headphones');

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: 'sony-headphones' } })
      );
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if slug not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ============ UPDATE TESTS ============

  describe('update', () => {
    it('should update a product successfully', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        price: 39999,
      });

      const result = await service.update(mockProductId, { price: 39999 });

      expect(mockPrismaService.product.update).toHaveBeenCalled();
      expect(result.price).toBe(39999);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', { price: 100 })).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ConflictException if new SKU conflicts with another product', async () => {
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce({ ...mockProduct, id: 'other-id' });

      await expect(service.update(mockProductId, { sku: 'CONFLICT-SKU' })).rejects.toThrow(
        ConflictException
      );
    });

    it('should regenerate slug when name changes', async () => {
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(null);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        name: 'New Headphones',
        slug: 'new-headphones',
      });

      const result = await service.update(mockProductId, { name: 'New Headphones' });

      expect(result.slug).toBe('new-headphones');
    });
  });

  // ============ REMOVE TESTS ============

  describe('remove', () => {
    it('should delete a product and its image files', async () => {
      const productWithImages = {
        ...mockProduct,
        images: [
          { id: 'img-1', url: '/uploads/products/img1.jpg' },
          { id: 'img-2', url: '/uploads/products/img2.jpg' },
        ],
      };
      mockPrismaService.product.findUnique.mockResolvedValue(productWithImages);
      mockPrismaService.product.delete.mockResolvedValue(productWithImages);

      const result = await service.remove(mockProductId);

      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id: mockProductId },
      });
      expect(fs.unlink).toHaveBeenCalledTimes(2);
      expect(result.message).toContain('deleted successfully');
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ============ IMAGE TESTS ============

  describe('uploadImages', () => {
    it('should save images for a product', async () => {
      const mockFiles: any = [
        { filename: 'img1.jpg', originalname: 'img1.jpg', mimetype: 'image/jpeg' },
        { filename: 'img2.jpg', originalname: 'img2.jpg', mimetype: 'image/jpeg' },
      ];

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.productImage.create.mockResolvedValue({
        id: 'img-uuid',
        url: '/uploads/products/img1.jpg',
        publicId: 'img1.jpg',
        isMain: true,
        displayOrder: 0,
        productId: mockProductId,
      });

      const result = await service.uploadImages(mockProductId, mockFiles);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.productImage.create).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if no files provided', async () => {
      await expect(service.uploadImages(mockProductId, [])).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadImages('nonexistent', [{ filename: 'img.jpg' } as any])
      ).rejects.toThrow(NotFoundException);
    });
  });
});
