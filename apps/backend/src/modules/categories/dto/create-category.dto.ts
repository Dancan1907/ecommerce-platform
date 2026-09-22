/**
 * Create Category DTO
 *
 * Defines the structure and validation rules for category creation requests.
 * - Ensures required fields are present and valid
 * - Provides Swagger documentation for API consumers
 * - Supports optional fields for slug, description, and parent category
 */

import { IsString, IsOptional, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Electronics',
    description: 'Category name',
  })
  @IsString({ message: 'Category name must be a string' })
  @MinLength(1, { message: 'Category name is required' })
  name!: string;

  @ApiProperty({
    example: 'electronic-devices-and-gadgets',
    description: 'URL-friendly slug (optional)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Slug must be a string' })
  slug?: string;

  @ApiProperty({
    example: 'Electronic devices and gadgets',
    description: 'Category description (optional)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({
    example: 'uuid-parent-id',
    description: 'Parent category ID for nested categories (optional)',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
  parentId?: string;
}
