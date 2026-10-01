/**
 * Prisma Module
 *
 * Provides the Prisma client as a provider across the application.
 * - Declares PrismaService as a provider
 * - Exports PrismaService for dependency injection
 * - Marked as @Global so it can be used anywhere without re-importing
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // ✅ Makes PrismaService available globally across the app
@Module({
  // ✅ Register PrismaService as a provider
  providers: [PrismaService],

  // ✅ Export PrismaService so other modules can inject it
  exports: [PrismaService],
})
export class PrismaModule {}
