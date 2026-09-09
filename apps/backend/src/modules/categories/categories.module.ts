/**
 * Categories Module
 *
 * Organizes all category-related components:
 * - Controller: Handles HTTP requests (CategoriesController)
 * - Service: Business logic (CategoriesService)
 * - DTOs: Input validation (CreateCategoryDto, UpdateCategoryDto)
 * - PrismaModule: Provides database access via PrismaService
 *
 * Exports CategoriesService so other modules can reuse category logic.
 */

import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  // ✅ Import PrismaModule to access PrismaService for DB operations
  imports: [PrismaModule],

  // ✅ Register the controller that exposes category endpoints
  controllers: [CategoriesController],

  // ✅ Register the service that contains category business logic
  providers: [CategoriesService],

  // ✅ Export service so other modules (e.g., ProductsModule) can use category logic
  exports: [CategoriesService],
})
export class CategoriesModule {}
