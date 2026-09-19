/**
 * CreateProductDto
 *
 * Validates data for creating a new product.
 * Images are uploaded separately via multipart/form-data.
 */
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsBoolean,
  MinLength,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    example: 'Wireless Bluetooth Headphones',
    description: 'Product name',
  })
  @IsString()
  @MinLength(3, { message: 'Product name must be at least 3 characters long' })
  @MaxLength(200, { message: 'Product name cannot exceed 200 characters' })
  name!: string;

  @ApiProperty({
    example: 'Premium noise-cancelling headphones with 30-hour battery life',
  })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description!: string;

  @ApiProperty({
    example: 99.99,
    description: 'Product price in KES',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must be a number with up to 2 decimals' })
  @Min(0, { message: 'Price cannot be negative' })
  price!: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Available stock quantity (optional)',
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Stock quantity cannot be negative' })
  stockQuantity?: number;

  @ApiProperty({ example: 'BT-HD-2024-001', description: 'Unique stock keeping unit' })
  @IsString()
  @MinLength(3, { message: 'SKU must be at least 3 characters long' })
  sku!: string;

  @ApiProperty({ example: 'uuid-category-id', description: 'Category ID' })
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  categoryId!: string;

  @ApiPropertyOptional({ example: true, description: 'Whether product is active/visible' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: ['image1.jpg', 'image2.jpg'],
    description: 'Product images (uploaded separately)',
  })
  @IsOptional()
  @IsString({ each: true })
  images?: string[];
}
