/**
 * CreatePaymentIntentDto
 *
 * Validates data for creating a Stripe Payment Intent.
 * The amount is derived from the order, so only the order ID is needed.
 */
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({
    example: 'order-uuid-here',
    description: 'Order ID to create a payment intent for',
  })
  @IsUUID('4', { message: 'Order ID must be a valid UUID' })
  orderId!: string;
}
