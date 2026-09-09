/**
 * Categories Service
 *
 * Handles all category-related business logic:
 * - Create categories with auto-generated slugs
 * - Retrieve categories with hierarchical structure
 * - Update existing categories
 * - Delete categories (currently hard delete, can be adapted to soft delete)
 * - Get category tree for nested categories
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a URL-friendly slug from a string
   * Example: "Electronics & Gadgets" → "electronics-gadgets"
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Collapse multiple hyphens
  }

  /**
   * Create a new category
   * - Auto-generates slug if not provided
   * - Ensures slug uniqueness
   * - Validates parent category existence
   */
  async create(createCategoryDto: CreateCategoryDto) {
    const { name, slug, description, parentId } = createCategoryDto;

    // Generate slug if not provided
    let finalSlug = slug || this.generateSlug(name);

    // Ensure slug is unique
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug: finalSlug },
    });
    if (existingCategory) {
      // Append timestamp suffix if slug already exists
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-6)}`;
    }

    // Validate parent category if provided
    if (parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        throw new NotFoundException(`Parent category with ID ${parentId} not found`);
      }
    }

    return this.prisma.category.create({
      data: { name, slug: finalSlug, description, parentId },
    });
  }

  /**
   * Get all categories
   * - Returns flat list with parent-child relationships
   * - Can be filtered by parentId
   */
  async findAll(parentId?: string) {
    return this.prisma.category.findMany({
      where: { parentId: parentId || null },
      include: { parent: true, children: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get category tree (hierarchical structure)
   * - Returns categories with nested children
   */
  async findTree() {
    return this.prisma.category.findMany({
      where: { parentId: null }, // Only root categories
      include: {
        children: {
          include: { children: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a single category by ID
   */
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { parent: true, children: true },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  /**
   * Get a single category by slug
   */
  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { parent: true, children: true },
    });
    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }
    return category;
  }

  /**
   * Update a category
   * - Auto-generates new slug if name changes
   * - Validates parent category existence
   * - Prevents circular references
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const { name, slug, description, parentId } = updateCategoryDto;

    // Generate slug if name changes but slug not provided
    let finalSlug = slug;
    if (name && !slug) {
      finalSlug = this.generateSlug(name);
    }

    // Prevent circular reference
    if (parentId === id) {
      throw new ConflictException('Category cannot be its own parent');
    }

    // Validate parent category if provided
    if (parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        throw new NotFoundException(`Parent category with ID ${parentId} not found`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: { name, slug: finalSlug, description, parentId },
    });
  }

  /**
   * Delete a category
   * - Currently hard delete (removes category record)
   * - Products in this category should handle categoryId = null separately
   */
  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    await this.prisma.category.delete({ where: { id } });
    return { message: `Category '${existing.name}' deleted successfully` };
  }
}
