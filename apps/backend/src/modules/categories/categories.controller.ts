/**
 * Categories Controller
 *
 * Exposes HTTP endpoints for category operations:
 * - GET /categories        → List all categories (public, optional parentId filter)
 * - GET /categories/tree   → Get category hierarchy (public)
 * - GET /categories/:id    → Get single category by ID (public)
 * - GET /categories/slug/:slug → Get single category by slug (public)
 * - POST /categories       → Create category (ADMIN only)
 * - PUT /categories/:id    → Update category (ADMIN only)
 * - DELETE /categories/:id → Delete category (ADMIN only)
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Create a new category
   * - Restricted to ADMIN users
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  /**
   * Get all categories
   * - Public endpoint
   * - Optional filter by parentId
   */
  @Public()
  @Get()
  findAll(@Query('parentId') parentId?: string) {
    return this.categoriesService.findAll(parentId);
  }

  /**
   * Get category tree (hierarchical structure)
   * - Public endpoint
   */
  @Public()
  @Get('tree')
  findTree() {
    return this.categoriesService.findTree();
  }

  /**
   * Get category by ID
   * - Public endpoint
   */
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  /**
   * Get category by slug
   * - Public endpoint
   */
  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  /**
   * Update a category
   * - Restricted to ADMIN users
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  /**
   * Delete a category
   * - Restricted to ADMIN users
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
