/**
 * Categories Service Tests
 *
 * Tests for the categories service covering:
 * - Creating categories
 * - Finding categories
 * - Updating categories
 * - Deleting categories
 * - Category tree
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaService: PrismaService;

  const mockCategory = {
    id: 'cat-123',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices and gadgets',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCategories = [
    mockCategory,
    {
      id: 'cat-456',
      name: 'Laptops',
      slug: 'laptops',
      description: 'Laptops and notebooks',
      parentId: 'cat-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a category with auto-generated slug', async () => {
      const createDto = { name: 'Smartphones', description: 'Mobile phones and accessories' };

      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.category.create as jest.Mock).mockResolvedValue({
        ...mockCategory,
        name: 'Smartphones',
        slug: 'smartphones',
      });

      const result = await service.create(createDto);

      expect(prismaService.category.create).toHaveBeenCalled();
      expect(result.slug).toBe('smartphones');
    });

    it('should create a category with custom slug', async () => {
      const createDto = {
        name: 'Smartphones',
        slug: 'mobile-phones',
        description: 'Mobile phones and accessories',
      };

      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.category.create as jest.Mock).mockResolvedValue({
        ...mockCategory,
        name: 'Smartphones',
        slug: 'mobile-phones',
      });

      const result = await service.create(createDto);

      expect(result.slug).toBe('mobile-phones');
    });

    it('should handle duplicate slug by appending suffix', async () => {
      const createDto = { name: 'Electronics' };

      (prismaService.category.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockCategory) // First call finds existing
        .mockResolvedValueOnce(null); // Second call finds no match

      (prismaService.category.create as jest.Mock).mockResolvedValue({
        ...mockCategory,
        slug: expect.stringMatching(/electronics-\d{6}/),
      });

      const result = await service.create(createDto);

      expect(result.slug).toMatch(/electronics-\d{6}/);
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(prismaService.category.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should filter categories by parentId', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValue([mockCategories[1]]);

      const result = await service.findAll('cat-123');

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: { parentId: 'cat-123' },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findTree', () => {
    it('should return category tree with nested children', async () => {
      (prismaService.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const result = await service.findTree();

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: { parentId: null },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
      expect(result).toEqual(mockCategories);
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);

      const result = await service.findOne('cat-123');

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateDto = { name: 'Consumer Electronics', description: 'Updated description' };

      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prismaService.category.update as jest.Mock).mockResolvedValue({
        ...mockCategory,
        name: 'Consumer Electronics',
        description: 'Updated description',
      });

      const result = await service.update('cat-123', updateDto);

      expect(prismaService.category.update).toHaveBeenCalled();
      expect(result.name).toBe('Consumer Electronics');
    });

    it('should throw NotFoundException if category not found', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if parentId equals category id', async () => {
      const updateDto = { parentId: 'cat-123' };

      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);

      await expect(service.update('cat-123', updateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prismaService.category.delete as jest.Mock).mockResolvedValue(mockCategory);

      const result = await service.remove('cat-123');

      expect(prismaService.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-123' } });
      expect(result.message).toContain('deleted successfully');
    });

    it('should throw NotFoundException if category not found', async () => {
      (prismaService.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
