/**
 * Orders Controller
 *
 * Endpoints for order operations:
 * - Create order from cart (checkout)
 * - Get user's orders
 * - Get specific order
 * - Cancel order
 * - Admin: list all orders, update status
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; role: UserRole };
}

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Create a new order from the user's cart (checkout).
   */
  @Post()
  @ApiOperation({ summary: 'Create order from cart (checkout)' })
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, dto);
  }

  /**
   * Get current user's orders (paginated).
   */
  @Get()
  @ApiOperation({ summary: 'Get current user orders' })
  findUserOrders(@Request() req: AuthenticatedRequest, @Query() query: QueryOrderDto) {
    return this.ordersService.findUserOrders(req.user.id, query);
  }

  /**
   * Admin: Get all orders across the platform.
   * IMPORTANT: this route must come BEFORE /:id
   */
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/all')
  @ApiOperation({ summary: 'List all orders (Admin only)' })
  findAllAdmin(@Query() query: QueryOrderDto) {
    return this.ordersService.findAllAdmin(query);
  }

  /**
   * Get a specific order (owner or admin).
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.ordersService.findOne(id, req.user.id, isAdmin);
  }

  /**
   * Cancel an order (owner or admin).
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order' })
  cancel(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.ordersService.cancel(id, req.user.id, isAdmin);
  }

  /**
   * Admin: Update order status.
   */
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
