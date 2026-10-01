/**
 * Auth Service
 *
 * Core authentication business logic:
 * - Register new users
 * - Login and validate credentials
 * - Generate JWT tokens
 * - Refresh tokens
 * - Validate refresh tokens
 * - Logout and profile retrieval
 *
 * This service handles all authentication-related operations
 * and interacts with the database through Prisma.
 */

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Register a new user
   * - Check if email already exists
   * - Hash password securely
   * - Save user in DB with default role USER if none provided
   * - Return user object without password hash
   */
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password before saving
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in database
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: (role as UserRole) || UserRole.USER,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    return user; // password hash excluded
  }

  /**
   * Login user
   * - Find user by email
   * - Validate account is active
   * - Compare password with stored hash
   * - Generate tokens (access + refresh)
   * - Return tokens + user data without password
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Exclude password hash from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;

    return { ...tokens, user: userWithoutPassword };
  }

  /**
   * Generate JWT access and refresh tokens
   * - Access token: short-lived (e.g., 15m)
   * - Refresh token: long-lived (e.g., 7d)
   * - Hash refresh token and store in DB for validation
   */
  async generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };

    // Access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES') || '15m',
    });

    // Refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES') || '7d',
    });

    // Store hashed refresh token in DB
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refresh tokens
   * - Verify refresh token signature
   * - Validate against stored hash
   * - Issue new access + refresh tokens
   */
  async refreshTokens(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Find user
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');
      if (!user.refreshTokenHash) throw new UnauthorizedException('Invalid refresh token');

      // Compare provided refresh token with stored hash
      const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isRefreshTokenValid) throw new UnauthorizedException('Invalid refresh token');

      // Generate new tokens
      return await this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user
   * - Clear stored refresh token hash
   * - Prevents reuse of old refresh token
   */
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  /**
   * Get user profile
   * - Fetch user by ID
   * - Return profile without password hash
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}
