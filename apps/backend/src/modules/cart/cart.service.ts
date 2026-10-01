/**
 * Cart Service
 *
 * Business logic for shopping cart operations:
 * - Get or create a user's cart
 * - Add items (with stock validation)
 * - Update item quantities
 * - Remove items
 * - Clear cart
 * - Validate cart before checkout
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create the user's cart
   * Every user has exactly one cart (auto-created on first access).
   */
  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { displayOrder: 'asc' }, take: 1 },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { orderBy: { displayOrder: 'asc' }, take: 1 },
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  /**
   * Compute cart totals (subtotal, item count)
   */
  private computeTotals(cart: any) {
    const subtotal = cart.items.reduce(
      (sum: number, item: any) => sum + Number(item.product.price) * item.quantity,
      0
    );
    const itemCount = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    return { subtotal, itemCount };
  }

  /**
   * Get the current user's cart
   */
  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const totals = this.computeTotals(cart);
    return { ...cart, ...totals };
  }

  /**
   * Add a product to the cart (or increment quantity if it already exists)
   */
  async addItem(userId: string, dto: AddToCartDto) {
    const { productId, quantity } = dto;

    // Verify product exists and is active
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    if (!product.isActive) {
      throw new BadRequestException(`Product '${product.name}' is not available`);
    }

    // Verify stock
    const cart = await this.getOrCreateCart(userId);
    const existingItem = cart.items.find((item) => item.productId === productId);
    const existingQty = existingItem?.quantity ?? 0;
    const newQty = existingQty + quantity;

    if (newQty > product.stockQuantity) {
      throw new BadRequestException(
        `Only ${product.stockQuantity} unit(s) of '${product.name}' available in stock`
      );
    }

    // Upsert cart item
    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Update quantity of a specific cart item
   */
  async updateItem(userId: string, productId: string, dto: UpdateCartItemDto) {
    const { quantity } = dto;
    const cart = await this.getOrCreateCart(userId);

    const item = cart.items.find((i) => i.productId === productId);
    if (!item) {
      throw new NotFoundException(`Product is not in your cart`);
    }

    if (quantity > item.product.stockQuantity) {
      throw new BadRequestException(
        `Only ${item.product.stockQuantity} unit(s) available in stock`
      );
    }

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  /**
   * Remove a specific item from the cart
   */
  async removeItem(userId: string, productId: string) {
    const cart = await this.getOrCreateCart(userId);

    const item = cart.items.find((i) => i.productId === productId);
    if (!item) {
      throw new NotFoundException(`Product is not in your cart`);
    }

    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return this.getCart(userId);
  }

  /**
   * Clear the entire cart
   */
  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCart(userId);
  }

  /**
   * Validate cart before checkout
   * Returns list of issues (empty = ready to checkout)
   */
  async validateCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const issues: string[] = [];

    if (cart.items.length === 0) {
      issues.push('Cart is empty');
    }

    for (const item of cart.items) {
      if (!item.product.isActive) {
        issues.push(`'${item.product.name}' is no longer available`);
      }
      if (item.quantity > item.product.stockQuantity) {
        issues.push(
          `'${item.product.name}' has only ${item.product.stockQuantity} unit(s) in stock (you have ${item.quantity})`
        );
      }
    }

    const totals = this.computeTotals(cart);
    return {
      valid: issues.length === 0,
      issues,
      itemCount: totals.itemCount,
      subtotal: totals.subtotal,
    };
  }
}
