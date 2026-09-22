/**
 * CreateOrderDto
 *
 * Validates data for creating an order from the user's cart.
 */
import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    example: '123 Main Street, Apt 4B, Nairobi, Kenya',
    description: 'Full shipping address',
  })
  @IsString()
  @MinLength(10, { message: 'Shipping address must be at least 10 characters long' })
  shippingAddress!: string;

  @ApiProperty({
    example: 'STRIPE',
    description: 'Payment method (STRIPE for now, MPESA later)',
    required: false,
    default: 'STRIPE',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
