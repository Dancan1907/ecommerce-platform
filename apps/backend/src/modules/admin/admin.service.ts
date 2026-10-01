/**
 * Admin Service
 *
 * Aggregated stats and reports for the admin dashboard.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get dashboard overview statistics.
   */
  async getStats() {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      paidOrders,
      pendingOrders,
      lowStockProducts,
      revenueAgg,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.order.count(),
      this.prisma.order.count({
        where: { status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] } },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.product.count({
        where: { isActive: true, stockQuantity: { lte: 5 } },
      }),
      this.prisma.order.aggregate({
        where: {
          status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        },
        _sum: { total: true },
      }),
    ]);

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      paidOrders,
      pendingOrders,
      lowStockProducts,
      totalRevenue: Number(revenueAgg._sum.total ?? 0),
    };
  }

  /**
   * Get recent orders (last N).
   */
  async getRecentOrders(limit = 5) {
    return this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { select: { id: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  /**
   * Get top-selling products (by order count).
   * Simple version — counts how many times each SKU appears in orderItems.
   */
  async getTopProducts(limit = 5) {
    const results = await this.prisma.orderItem.groupBy({
      by: ['productSku'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    // Enrich with product names
    const skus = results.map((r) => r.productSku);
    const products = await this.prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { sku: true, name: true, slug: true, price: true },
    });
    const productMap = new Map(products.map((p) => [p.sku, p]));

    return results.map((r) => ({
      sku: r.productSku,
      quantitySold: r._sum.quantity ?? 0,
      product: productMap.get(r.productSku) ?? null,
    }));
  }
}
