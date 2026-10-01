/**
 * Users Controller
 *
 * Endpoints for user's own profile management,
 * plus admin-only user management.
 * All routes require authentication.
 */

import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; role: UserRole };
}

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get own profile.
   */
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.getProfile(req.user.id);
  }

  /**
   * Update own profile.
   */
  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@Request() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  /**
   * Change own password.
   */
  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  changePassword(@Request() req: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, dto);
  }

  /**
   * List all users (Admin only).
   */
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'List all users (Admin only)' })
  async findAll(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('limit') limit?: string
  ) {
    return this.usersService.findAll({
      search,
      role,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * Update a user (Admin only).
   */
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Update user role/status (Admin only)' })
  async updateUser(@Param('id') userId: string, @Body() dto: AdminUpdateUserDto) {
    return this.usersService.updateUser(userId, dto);
  }
}
