import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({
    example: 'Electronics',
    description: 'Category name (optional)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Category name must be a string' })
  name?: string;

  @ApiProperty({
    example: 'electronic-device',
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
    description: 'Parent category ID (optional)',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
  parentId?: string;
}
