/**
 * Prisma Service Tests
 *
 * Verifies that PrismaService:
 * - Connects on module init
 * - Disconnects on module destroy
 * - Exposes PrismaClient methods (user, category, product, order, etc.)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    if (service) {
      await service.$disconnect();
    }
  });

  describe('Lifecycle hooks', () => {
    it('should connect to the database on init', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalledTimes(1);
    });

    it('should disconnect from the database on destroy', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('PrismaClient methods', () => {
    it('should expose core PrismaClient methods', () => {
      expect(service.$connect).toBeDefined();
      expect(service.$disconnect).toBeDefined();
      expect(service.$transaction).toBeDefined();
    });

    it('should expose domain models (user, category, product, order)', () => {
      expect(service.user).toBeDefined();
      expect(service.category).toBeDefined();
      expect(service.product).toBeDefined();
      expect(service.order).toBeDefined();
    });
  });
});
