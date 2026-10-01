/**
 * Cart Controller
 *
 * HTTP endpoints for shopping cart operations.
 * All endpoints require authentication.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

@ApiTags('Cart')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Get the current user's cart
   */
  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  getCart(@Request() req: AuthenticatedRequest) {
    return this.cartService.getCart(req.user.id);
  }

  /**
   * Add an item to the cart
   */
  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  addItem(@Request() req: AuthenticatedRequest, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(req.user.id, dto);
  }

  /**
   * Update quantity of a cart item
   */
  @Put('items/:productId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateItem(
    @Request() req: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto
  ) {
    return this.cartService.updateItem(req.user.id, productId, dto);
  }

  /**
   * Remove an item from the cart
   */
  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove item from cart' })
  removeItem(@Request() req: AuthenticatedRequest, @Param('productId') productId: string) {
    return this.cartService.removeItem(req.user.id, productId);
  }

  /**
   * Clear the entire cart
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear the entire cart' })
  clearCart(@Request() req: AuthenticatedRequest) {
    return this.cartService.clearCart(req.user.id);
  }

  /**
   * Validate cart before checkout
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate cart for checkout' })
  validateCart(@Request() req: AuthenticatedRequest) {
    return this.cartService.validateCart(req.user.id);
  }
}
