/**
 * Root Application Module
 *
 * Entry point for the NestJS application.
 * - Loads environment variables globally
 * - Imports feature modules (Auth, Prisma)
 * - Registers controllers and providers
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // ✅ Configuration module for environment variables
    // Makes .env values available globally via ConfigService
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ✅ Feature modules
    // AuthModule handles authentication (register, login, tokens, guards)
    AuthModule,

    // PrismaModule provides database access layer
    PrismaModule,
  ],

  // ✅ Root controller (optional, for health checks or app-level routes)
  controllers: [AppController],

  // ✅ Root service (optional, for app-level logic)
  providers: [AppService],
})
export class AppModule {}
