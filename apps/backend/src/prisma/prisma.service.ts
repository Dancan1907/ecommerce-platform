/**
 * Prisma Service
 *
 * Extends the PrismaClient with additional functionality.
 * - Manages database connection lifecycle
 * - Provides Prisma client for dependency injection
 * - Can be extended with custom helpers (transactions, logging, etc.)
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * Called when the NestJS module is initialized
   * ✅ Establishes a connection to the database
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Called when the NestJS module is destroyed
   * ✅ Gracefully disconnects from the database
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
