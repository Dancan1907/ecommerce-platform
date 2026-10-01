/**
 * Product Response DTOs
 *
 * Defines the shape of product responses (with images).
 */
import { ApiProperty } from '@nestjs/swagger';

export class ProductImageResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() url!: string;
  @ApiProperty() publicId!: string;
  @ApiProperty() isMain!: boolean;
  @ApiProperty() displayOrder!: number;
}

export class ProductResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() description!: string;
  @ApiProperty() price!: number;
  @ApiProperty() stockQuantity!: number;
  @ApiProperty() sku!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() categoryId!: string;
  @ApiProperty() sellerId!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: [ProductImageResponseDto] }) images!: ProductImageResponseDto[];
}

export class PaginatedProductsDto {
  @ApiProperty({ type: [ProductResponseDto] }) data!: ProductResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
}
