/**
 * Auth Service Tests
 *
 * Tests for the authentication service covering:
 * - User registration
 * - User login
 * - Token generation
 * - Token refresh
 * - Logout
 * - Profile retrieval
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  // Mock PrismaService
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  // Mock JwtService
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn().mockReturnValue({ sub: 'user-123', email: 'test@example.com' }),
  };

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashed-password',
      });

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'Password123!' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(service, 'generateTokens').mockResolvedValue(mockTokens);

      const result = await service.login(loginDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.passwordHash);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@example.com', password: 'Password123!' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'WrongPassword!' })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        refreshTokenHash: 'hashed-refresh',
      });

      const result = await service.generateTokens(mockUser.id, mockUser.email, mockUser.role);

      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'valid-refresh-token';

      mockJwtService.verify.mockReturnValue({ sub: 'user-123', email: 'test@example.com' });
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshTokenHash: 'hashed-refresh',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(service, 'generateTokens').mockResolvedValue(mockTokens);

      const result = await service.refreshTokens(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshTokens('invalid-refresh-token')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('logout', () => {
    it('should clear refresh token hash', async () => {
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, refreshTokenHash: null });

      await service.logout(mockUser.id);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshTokenHash: null },
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUser.id);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent-id')).rejects.toThrow(UnauthorizedException);
    });
  });
});
