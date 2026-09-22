/**
 * Category Entity
 *
 * Defines the structure of category responses returned by the API.
 * - Standardizes output format for categories
 * - Provides Swagger documentation for API consumers
 * - Complements DTOs (DTOs = input validation, Entities = output shape)
 */

import { ApiProperty } from '@nestjs/swagger';

export class CategoryEntity {
  @ApiProperty({ example: 'uuid', description: 'Unique category ID' })
  id!: string;

  @ApiProperty({ example: 'Electronics', description: 'Category name' })
  name!: string;

  @ApiProperty({ example: 'electronics', description: 'URL-friendly slug' })
  slug!: string;

  @ApiProperty({
    example: 'Electronic devices and gadgets',
    description: 'Category description (optional)',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 'uuid-parent',
    description: 'Parent category ID (optional, for nested categories)',
    required: false,
  })
  parentId?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}
