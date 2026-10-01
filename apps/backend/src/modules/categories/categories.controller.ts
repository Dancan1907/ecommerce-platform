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
 * - POST /categories/:id/image → Upload category image (ADMIN only)
 */

import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

// Multer config for category image uploads
const categoryImageStorage = diskStorage({
  destination: './uploads/categories',
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Restrict uploads to image files only
const categoryImageFileFilter = (req: any, file: any, cb: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new BadRequestException('Only image files are allowed!'), false);
  }
  cb(null, true);
};

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Create a new category
   * - Restricted to ADMIN users
   */
  @ApiBearerAuth('access-token')
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
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({
    name: 'parentId',
    required: false,
    type: String,
    description: 'Filter categories by parent category ID',
  })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
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
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  /**
   * Upload an image for a category
   * - Restricted to ADMIN users
   * - Accepts multipart/form-data with a single "image" field
   * - Saves to uploads/categories/<uuid>.<ext> and updates category.imageUrl
   */
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: categoryImageStorage,
      fileFilter: categoryImageFileFilter,
    })
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload an image for a category' })
  uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.categoriesService.uploadImage(id, file);
  }

  /**
   * Delete a category
   * - Restricted to ADMIN users
   */
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
