/**
 * Auth Module
 *
 * Main authentication module that brings together all auth components.
 * - Imports JwtModule for token handling
 * - Imports PrismaModule for database access
 * - Declares AuthController for HTTP endpoints
 * - Provides AuthService (business logic) and JwtStrategy (token validation)
 * - Exports AuthService for use in other modules
 */

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtModule } from './jwt.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  // ✅ Import supporting modules
  imports: [
    JwtModule, // Provides JwtService globally
    PrismaModule, // Provides PrismaService globally
  ],

  // ✅ Register controllers
  controllers: [AuthController],

  // ✅ Register providers (services + strategies)
  providers: [
    AuthService, // Core authentication business logic
    JwtStrategy, // JWT validation strategy
  ],

  // ✅ Export AuthService so other modules can use it
  exports: [AuthService],
})
export class AuthModule {}
