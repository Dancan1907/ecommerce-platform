/**
 * RefundPaymentDto
 *
 * Validates data for admin-initiated refunds.
 */
import { IsUUID, IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiProperty({
    example: 'order-uuid-here',
    description: 'Order ID to refund',
  })
  @IsUUID('4', { message: 'Order ID must be a valid UUID' })
  orderId: string;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Amount to refund in KES. Omit for full refund.',
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Refund amount must be at least 1 KES' })
  amount?: number;

  @ApiPropertyOptional({
    example: 'Customer requested refund',
    description: 'Reason for refund (for audit trail)',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
