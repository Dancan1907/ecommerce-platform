/**
 * Root application service
 *
 * Provides health-check and root responses used by load balancers,
 * Render's health probe, and simple uptime monitors.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello The Racing Shop API!';
  }

  /**
   * Health check.
   *
   * Returns a small JSON payload so Render (or any uptime monitor)
   * can tell if the app is up and the DB is reachable. If the DB
   * query fails, the endpoint returns 500 — which is what we want
   * the probe to see.
   */
  async getHealth(): Promise<{
    status: 'ok';
    timestamp: string;
    uptime: number;
    env: string;
    database: 'up';
  }> {
    // A cheap query that forces a DB round-trip. If Prisma can't
    // connect, this throws and Nest returns a 500 automatically.
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      env: process.env.NODE_ENV ?? 'development',
      database: 'up',
    };
  }
}
