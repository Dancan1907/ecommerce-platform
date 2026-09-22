/**
 * Root Application Module
 *
 * Entry point for the NestJS application.
 * - Loads environment variables globally
 * - Imports feature modules (Auth, Prisma, Categories)
 * - Registers root-level controllers and providers
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
@Module({
  imports: [
    // ✅ Configuration module for environment variables
    // Makes .env values available globally via ConfigService
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ✅ Feature modules
    // AuthModule → handles authentication (login, register, guards, strategies)
    AuthModule,

    // PrismaModule → provides PrismaService for database access
    PrismaModule,

    // CategoriesModule → handles category CRUD and hierarchy
    CategoriesModule,
    ProductsModule,
    CartModule,
  ],

  // ✅ Root controller (optional, for app-level routes like health checks)
  controllers: [AppController],

  // ✅ Root service (optional, for app-level logic)
  providers: [AppService],
})
export class AppModule {}
