/**
 * Products Service
 *
 * Business logic for product CRUD operations:
 * - Create product with auto-generated slug and image handling
 * - List products with filters (category, search, price, pagination)
 * - Get product by ID or slug
 * - Update product (regenerate slug if name changes)
 * - Delete product with cleanup
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryProductDto } from './dto/query-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Create a new product
   * - Validates category exists
   * - Auto-generates unique slug
   * - Checks SKU uniqueness
   */
  async create(createProductDto: CreateProductDto, sellerId: string) {
    //Destructure the dto to use the fields directly
    const { name, description, price, stockQuantity, sku, categoryId, isActive } = createProductDto;

    // Check category exists
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // Check SKU uniqueness
    const existingSku = await this.prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      throw new ConflictException(`Product with SKU '${sku}' already exists`);
    }

    // Generate unique slug  from product name
    let slug = this.generateSlug(name);
    const existingSlug = await this.prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-6)}`;
    }
    //product creation    in the database
    return this.prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        stockQuantity,
        sku,
        categoryId,
        sellerId,
        isActive: isActive ?? true,
      },
      include: {
        //Fetch related data in the response
        images: true,
        category: true,
        seller: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }
  /**
   * List products with filters, sorting, and pagination
   */
  async findAll(query: QueryProductDto) {
    //Destructuring query parameter
    const {
      categoryId,
      search,
      minPrice,
      maxPrice,
      isActive,
      sellerId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20, //20 Items per page
    } = query;

    /* Build where clause.
    Initialize an empty object that will hold prisma filters
    The object is build dynamically depending o which filters are provided */
    const where: any = {};

    /*Apply filters
    Add filters to where clause if they are present
    Example: if categoryId is provided, only products in that category will be returned.*/
    if (categoryId) where.categoryId = categoryId;
    if (sellerId) where.sellerId = sellerId;
    if (isActive !== undefined) where.isActive = isActive;
    /*Search Filter
    If a search term is provided, it looks for products where either the name or description contains the term*/
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    /* Price Range Filter
     If min or max price is provided, adds a price filter.
     gte = greater than or equal to minPrice.
    lte = less than or equal to maxPrice.*/
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    /* Pagination
    Calculates how many records to skip based on the current page.
    Example: page 2, limit 20 → skip = 20 (skip the first 20 records).*/
    const skip = (page - 1) * limit;

    /* Execute queries in parallel
    Runs two queries at the same time:
    findMany → fetches the actual product data with filters,
    sorting, pagination, and related entities (images, category, seller).
    count → counts the total number of products matching the filters
    (used for pagination metadata).*/
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { displayOrder: 'asc' } },
          category: { select: { id: true, name: true, slug: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    //return paginated response
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /* Get product by ID */
  //Declares an async method that takes a product’s unique ID (UUID or database primary key).
  async findOne(id: string) {
    /*Uses Prisma’s findUnique to fetch the product by its ID.
    Includes related data:
    images → ordered by displayOrder. category → full category object.
    seller → only selected fields (id, firstName, lastName, email).
    reviews → latest 10 reviews, each with the user who wrote it. */
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        category: true,
        seller: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reviews: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    //Returns the product with all the included relations.
    return product;
  }

  /* Get product by slug */
  async findBySlug(slug: string) {
    /* Uses Prisma’s findUnique to fetch the product by its slug.
     Includes related data:
     images → ordered by displayOrder.
     category → full category object.
     seller → selected fields (id, firstName, lastName). */
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        category: true,
        seller: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }
    return product;
  }

  /* Update a product */
  async update(id: string, updateProductDto: UpdateProductDto) {
    //check if the product exists
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    //Destructures the fields from the DTO for easier use.
    const { name, description, price, stockQuantity, sku, categoryId, isActive } = updateProductDto;

    // Check SKU uniqueness if changed
    if (sku && sku !== existing.sku) {
      const duplicateSku = await this.prisma.product.findUnique({ where: { sku } });

      //Throws a ConflictException if another product already uses it.
      if (duplicateSku) {
        throw new ConflictException(`Product with SKU '${sku}' already exists`);
      }
    }

    // Check category if changed
    if (categoryId && categoryId !== existing.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${categoryId} not found`);
      }
    }

    // Regenerate slug if name changed and no new slug conflict
    //If the product name changes, regenerate the slug.
    //Ensures uniqueness by appending a timestamp if needed.
    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = this.generateSlug(name);
      const duplicateSlug = await this.prisma.product.findUnique({ where: { slug } });
      if (duplicateSlug && duplicateSlug.id !== id) {
        slug = `${slug}-${Date.now().toString().slice(-6)}`;
      }
    }
    //Updates only the fields provided (using conditional spreads).
    //Returns the updated product including images and category.
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name, slug }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(stockQuantity !== undefined && { stockQuantity }),
        ...(sku !== undefined && { sku }),
        ...(categoryId !== undefined && { categoryId }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        category: true,
      },
    });
  }

  /**
   * Delete a product
   * - Removes image files from disk
   * - Deletes database record
   */
  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Delete image files from disk (best-effort)
    for (const image of existing.images) {
      try {
        const filePath = join(process.cwd(), image.url);
        await fs.unlink(filePath);
      } catch (error) {
        // Log but don't fail deletion if file is missing
        console.warn(`Failed to delete image file: ${image.url}`, error);
      }
    }

    await this.prisma.product.delete({ where: { id } });
    return { message: `Product '${existing.name}' deleted successfully` };
  }

  // ==================== IMAGE METHODS ====================

  /**
   * Upload images for a product
   */
  async uploadImages(productId: string, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Determine starting displayOrder
    const startingOrder = product.images.length;

    // Save images metadata to DB
    const images = await Promise.all(
      files.map((file, index) =>
        this.prisma.productImage.create({
          data: {
            url: `/uploads/products/${file.filename}`,
            publicId: file.filename,
            isMain: product.images.length === 0 && index === 0,
            displayOrder: startingOrder + index,
            productId,
          },
        })
      )
    );

    return images;
  }

  /**
   * Delete a single product image
   */
  async deleteImage(imageId: string) {
    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) {
      throw new NotFoundException(`Image with ID ${imageId} not found`);
    }

    // Delete file from disk
    try {
      const filePath = join(process.cwd(), image.url);
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Failed to delete image file: ${image.url}`, error);
    }

    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { message: 'Image deleted successfully' };
  }

  /**
   * Set an image as the main image for a product
   */
  async setMainImage(imageId: string) {
    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) {
      throw new NotFoundException(`Image with ID ${imageId} not found`);
    }

    // Unset any existing main image for this product
    await this.prisma.productImage.updateMany({
      where: { productId: image.productId, isMain: true },
      data: { isMain: false },
    });

    // Set the new main image
    return this.prisma.productImage.update({
      where: { id: imageId },
      data: { isMain: true },
    });
  }
}
