/**
 * UpdateOrderStatusDto
 *
 * Validates data for updating an order's status (Admin only).
 */
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: 'SHIPPED',
    description: 'New order status',
  })
  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  status!: OrderStatus;
}
