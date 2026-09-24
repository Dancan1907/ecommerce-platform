/**
 * Integration Test Helpers
 *
 * Reusable utilities for booting the app, seeding the DB,
 * and performing authenticated requests.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

/**
 * Boot a full NestJS app for integration testing.
 * Applies the same pipes/prefixes as main.ts.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Match main.ts config
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  app.setGlobalPrefix('api/v1');

  await app.init();
  return app;
}

/**
 * Get the PrismaService from the booted app.
 */
export function getPrisma(app: INestApplication): PrismaService {
  return app.get(PrismaService);
}

/**
 * Wipe all tables in the correct order (FK-safe).
 * Call this in beforeEach of your test suite for a clean slate.
 */
export async function cleanDatabase(app: INestApplication) {
  const prisma = getPrisma(app);
  // Order matters — delete dependents first
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Create a test user with a known password.
 */
export async function createTestUser(
  app: INestApplication,
  overrides: Partial<{
    email: string;
    password: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  }> = {}
) {
  const prisma = getPrisma(app);
  const password = overrides.password ?? 'Test123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: overrides.email ?? `user-${Date.now()}@test.com`,
      passwordHash,
      firstName: overrides.firstName ?? 'Test',
      lastName: overrides.lastName ?? 'User',
      role: overrides.role ?? UserRole.USER,
      isEmailVerified: true,
      isActive: true,
    },
  });

  return { user, password };
}

/**
 * Create a test admin user.
 */
export async function createTestAdmin(app: INestApplication) {
  return createTestUser(app, {
    email: `admin-${Date.now()}@test.com`,
    role: UserRole.ADMIN,
  });
}

/**
 * Login and return an access token.
 */
export async function loginAndGetToken(
  app: INestApplication,
  email: string,
  password: string
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  return response.body.accessToken;
}

/**
 * Build an Authorization header.
 */
export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Create a test category.
 */
export async function createTestCategory(
  app: INestApplication,
  overrides: Partial<{ name: string; slug: string }> = {}
) {
  const prisma = getPrisma(app);
  const name = overrides.name ?? `Category ${Date.now()}`;
  return prisma.category.create({
    data: {
      name,
      slug: overrides.slug ?? name.toLowerCase().replace(/\s+/g, '-'),
    },
  });
}

/**
 * Create a test product owned by a seller.
 */
export async function createTestProduct(
  app: INestApplication,
  sellerId: string,
  categoryId: string,
  overrides: Partial<{
    name: string;
    sku: string;
    price: number;
    stockQuantity: number;
  }> = {}
) {
  const prisma = getPrisma(app);
  const name = overrides.name ?? `Product ${Date.now()}`;
  return prisma.product.create({
    data: {
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: 'Test product description for integration tests',
      price: overrides.price ?? 1000,
      stockQuantity: overrides.stockQuantity ?? 10,
      sku: overrides.sku ?? `SKU-${Date.now()}`,
      categoryId,
      sellerId,
      isActive: true,
    },
  });
}

/**
 * Re-export supertest so tests don't have to import it.
 */
export { request };
