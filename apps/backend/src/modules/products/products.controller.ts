/**
 * Products Controller
 *
 * Endpoints for product CRUD and image management.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Public } from '../auth/decorators/public.decorator';
import { UpdateProductDto } from './dto/update-product.dto';

// Multer config for image uploads
const imageStorage = diskStorage({
  destination: './uploads/products',
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

/*Files Filter
  Restrict uploads to image files only
 Checks MIME type against allowed formats (jpg, jpeg, png, gif, webp).*/
const imageFileFilter = (req: any, file: any, cb: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new BadRequestException('Only image files are allowed!'), false);
  }
  cb(null, true);
};

/*Authenticated Request Interface
 Extends Express Request to include a user object.
 Ensures TypeScript knows requests will carry authenticated user info (id, email, role).
 Useful for endpoints that need to know which seller is logged in. */
interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; role: UserRole };
}

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Create a new product (Admin/Seller only)
   */
  //Swagger decorator → indicates this endpoint requires Bearer token authentication.
  @ApiBearerAuth('access-token')
  //JwtAuthGuard → ensures the request has a valid JWT.
  //RolesGuard → ensures the user has the correct role.
  @UseGuards(JwtAuthGuard, RolesGuard)
  //Custom decorator → restricts access to users with either Admin or Seller roles.
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  //Maps this method to the POST /products route.
  @Post()
  //Swagger decorator → adds a summary description in API docs.
  //Helps frontend developers understand what this endpoint does.
  @ApiOperation({ summary: 'Create a new product' })
  /* Defines the controller method.
     @Body() createProductDto: binds request body to the DTO (validated).
     @Request() req: gives access to the authenticated request, including req.user.
     Calls the service method create, passing the DTO and the logged‑in user’s ID (sellerId).
     Returns the created product.*/
  create(@Body() createProductsDto: CreateProductDto, @Request() req: AuthenticatedRequest) {
    return this.productsService.create(createProductsDto, req.user.id);
  }

  /**
   * List products with filters and pagination (public)
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'List products with filters' })
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  /**
   * Get product by slug (public)
   * MUST come before /:id to avoid route conflict
   */
  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  /**
   * Get product by ID (public)
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  /**
   * Update a product (Admin/Seller only)
   */
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * Delete a product (Admin/Seller only)
   */
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // ==================== IMAGE ENDPOINTS ====================

  /**
   * Upload images for a product
   */
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('images', 10, { storage: imageStorage, fileFilter: imageFileFilter })
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload images for a product (max 10)' })
  uploadImages(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    return this.productsService.uploadImages(id, files);
  }

  /**
   * Delete a single image
   */
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Delete('images/:imageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product image' })
  deleteImage(@Param('imageId') imageId: string) {
    return this.productsService.deleteImage(imageId);
  }

  /**
   * Set an image as the main image
   */
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @Put('images/:imageId/main')
  @ApiOperation({ summary: 'Set an image as main product image' })
  setMainImage(@Param('imageId') imageId: string) {
    return this.productsService.setMainImage(imageId);
  }
}
