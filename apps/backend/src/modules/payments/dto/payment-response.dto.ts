/**
 * Payment Response DTOs
 *
 * Defines response shapes for payment operations.
 */
import { ApiProperty } from '@nestjs/swagger';

export class PaymentIntentResponseDto {
  @ApiProperty({ example: 'pi_3ABC123XYZ', description: 'Stripe payment intent ID' })
  paymentIntentId!: string;

  @ApiProperty({
    example: 'pi_3ABC123XYZ_secret_456',
    description: 'Client secret for Stripe Elements on the frontend',
  })
  clientSecret!: string;

  @ApiProperty({ example: 5000, description: 'Amount in smallest currency unit (cents)' })
  amount!: number;

  @ApiProperty({ example: 'usd', description: 'Currency code' })
  currency!: string;

  @ApiProperty({ example: 'requires_payment_method', description: 'Payment intent status' })
  status!: string;
}
