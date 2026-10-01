/**
 * Admin Controller
 *
 * Admin-only endpoints for dashboard statistics.
 */

import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('orders/recent')
  @ApiOperation({ summary: 'Get recent orders (Admin only)' })
  getRecentOrders(@Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number) {
    return this.adminService.getRecentOrders(limit);
  }

  @Get('products/top')
  @ApiOperation({ summary: 'Get top-selling products (Admin only)' })
  getTopProducts(@Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number) {
    return this.adminService.getTopProducts(limit);
  }
}
