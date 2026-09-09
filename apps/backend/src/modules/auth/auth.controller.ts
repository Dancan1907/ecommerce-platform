/**
 * Auth Controller
 *
 * Handles all authentication-related HTTP endpoints:
 * - Register new users
 * - Login
 * - Refresh tokens
 * - Logout
 * - Get user profile
 * - Role-protected routes (Admin, Seller)
 *
 * Each endpoint delegates to AuthService for business logic.
 * Guards and decorators enforce authentication/authorization.
 */

import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from '@prisma/client';

/**
 * Shape of the authenticated request populated by JwtStrategy.validate(),
 * which Passport attaches to req.user after a valid JWT is verified.
 * Must match the `select` fields returned by JwtStrategy.validate().
 */
interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user (public route)
   * @returns Created user object without password
   */
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Login user (public route)
   * @returns Access token, refresh token, and user data
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Refresh tokens (public route)
   * @returns New access + refresh tokens
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  /**
   * Logout user (requires JWT)
   * Clears refresh token hash in DB
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: AuthenticatedRequest) {
    await this.authService.logout(req.user.id);
    return { message: 'Logged out successfully' };
  }

  /**
   * Get current user profile (requires JWT)
   * @returns User profile without password hash
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.id);
  }

  /**
   * Example protected route - Admin only
   * Requires role ADMIN
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin')
  async adminAccess(@Request() req: AuthenticatedRequest) {
    return {
      message: 'You have admin access!',
      user: req.user,
    };
  }

  /**
   * Example protected route - Seller or Admin
   * Requires role SELLER or ADMIN
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @Get('seller')
  async sellerAccess(@Request() req: AuthenticatedRequest) {
    return {
      message: 'You have seller or admin access!',
      user: req.user,
    };
  }
}
