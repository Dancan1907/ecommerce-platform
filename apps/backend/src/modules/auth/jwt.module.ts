/**
 * JWT Module
 *
 * Configures JWT for the application using environment variables.
 * Provides JwtService globally for token generation and verification.
 *
 * - Uses async registration to pull secrets from ConfigService
 * - Sets default expiration for access tokens (15m if not provided)
 * - Exports JwtModule so it can be injected anywhere in the app
 */

import { Module, Global } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Global() // ✅ Makes JwtService available globally without re-importing
@Module({
  imports: [
    NestJwtModule.registerAsync({
      // ✅ Factory function to configure JWT dynamically
      useFactory: async (configService: ConfigService) => ({
        // Secret key for signing access tokens
        secret: configService.get<string>('JWT_ACCESS_SECRET'),

        // Default signing options
        signOptions: {
          // Expiration time for access tokens (fallback to 15m)
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES') || '15m',
        },
      }),
      inject: [ConfigService], // ✅ Inject ConfigService for environment variables
    }),
  ],
  exports: [NestJwtModule], // ✅ Export JwtModule so other modules can use JwtService
})
export class JwtModule {}
