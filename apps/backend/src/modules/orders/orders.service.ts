/**
 * Orders Service
 *
 * Business logic for order operations:
 * - Create order from user's cart (atomic transaction)
 * - Get user's orders
 * - Get single order
 * - Update order status (admin)
 * - Cancel order
 * - List all orders (admin)
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { OrderStatus } from '@prisma/client';
import { generateOrderNumber } from './utils/order-number.generator';

// Flat-rate shipping cost in KES (MVP)
const FLAT_SHIPPING_COST = 250;
// Tax rate (0% for MVP)
const TAX_RATE = 0;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an order from the user's cart.
   * Uses a transaction to ensure atomicity:
   *  - Read cart and validate
   *  - Generate order number
   *  - Create order + order items
   *  - Decrement product stock
   *  - Clear cart
   */
  async create(userId: string, dto: CreateOrderDto) {
    const { shippingAddress, paymentMethod = 'STRIPE' } = dto;

    // Run inside a transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Get user's cart with items
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Your cart is empty');
      }

      // 2. Validate each item (still in stock, active)
      for (const item of cart.items) {
        if (!item.product.isActive) {
          throw new BadRequestException(`Product '${item.product.name}' is no longer available`);
        }
        if (item.quantity > item.product.stockQuantity) {
          throw new BadRequestException(
            `Only ${item.product.stockQuantity} unit(s) of '${item.product.name}' available in stock`
          );
        }
      }

      // 3. Calculate totals
      const subtotal = cart.items.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0
      );
      const tax = subtotal * TAX_RATE;
      const total = subtotal + tax + FLAT_SHIPPING_COST;

      // 4. Generate order number
      const orderNumber = await generateOrderNumber(tx);

      // 5. Create the order with items (snapshot data)
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          tax,
          shippingCost: FLAT_SHIPPING_COST,
          total,
          status: OrderStatus.PENDING,
          shippingAddress,
          paymentMethod,
          items: {
            create: cart.items.map((item) => ({
              productName: item.product.name,
              productSku: item.product.sku,
              price: item.product.price,
              quantity: item.quantity,
              subtotal: Number(item.product.price) * item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      // 6. Decrement stock for each product
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      // 7. Clear the cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });
  }

  /**
   * Get all orders for the current user (paginated).
   */
  async findUserOrders(userId: string, query: QueryOrderDto) {
    const {
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const where: any = { userId };
    if (status) where.status = status;
    if (search) where.orderNumber = { contains: search, mode: 'insensitive' };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a specific order (must belong to user unless admin).
   */
  async findOne(orderId: string, userId: string, isAdmin: boolean) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return order;
  }

  /**
   * List all orders (admin only).
   */
  async findAllAdmin(query: QueryOrderDto) {
    const {
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};
    if (status) where.status = status;
    if (search) where.orderNumber = { contains: search, mode: 'insensitive' };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update order status (admin only).
   * Enforces valid transitions.
   */
  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Define valid transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[order.status].includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${dto.status}`);
    }

    const data: any = { status: dto.status };

    // Set timestamp fields based on status
    if (dto.status === OrderStatus.PAID) data.paidAt = new Date();
    if (dto.status === OrderStatus.SHIPPED) data.shippedAt = new Date();
    if (dto.status === OrderStatus.DELIVERED) data.deliveredAt = new Date();

    return this.prisma.order.update({
      where: { id: orderId },
      data,
      include: { items: true },
    });
  }

  /**
   * Cancel an order (user owns it OR admin).
   * Restores stock if order was not yet shipped.
   */
  async cancel(orderId: string, userId: string, isAdmin: boolean) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      if (!isAdmin && order.userId !== userId) {
        throw new ForbiddenException('You can only cancel your own orders');
      }

      if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
        throw new BadRequestException(
          `Cannot cancel an order that is already ${order.status.toLowerCase()}`
        );
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('Order is already cancelled');
      }

      // Restore stock for each item
      for (const item of order.items) {
        await tx.product.updateMany({
          where: { sku: item.productSku },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        include: { items: true },
      });
    });
  }
}
