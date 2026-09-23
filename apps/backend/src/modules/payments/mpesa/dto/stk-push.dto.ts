/**
 * StkPushDto
 *
 * Validates data for initiating an M-Pesa STK Push.
 */
import { IsUUID, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StkPushDto {
  @ApiProperty({
    example: 'order-uuid-here',
    description: 'Order ID to pay for',
  })
  @IsUUID('4', { message: 'Order ID must be a valid UUID' })
  orderId!: string;

  @ApiProperty({
    example: '254708374149',
    description:
      'Phone number in international format (254XXXXXXXXX). Must be a valid Kenyan number.',
  })
  @IsString()
  @Matches(/^254[17]\d{8}$/, {
    message: 'Phone number must be in format 254XXXXXXXXX (Safaricom or Airtel Kenya)',
  })
  phoneNumber!: string;
}
