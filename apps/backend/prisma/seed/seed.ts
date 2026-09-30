/**
 * Database Seeding Script
 *
 * Seeds foundational accounts only (admin + demo user).
 *
 * Products and categories are NOT seeded — they are managed through
 * the admin UI (/admin/products, /admin/categories). This keeps the
 * database as the single source of truth for catalog data.
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ---------- Admin user ----------
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecommerce.com' },
    update: {},
    create: {
      email: 'admin@ecommerce.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isEmailVerified: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ---------- Test user ----------
  const userPassword = await bcrypt.hash('User123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@ecommerce.com' },
    update: {},
    create: {
      email: 'user@ecommerce.com',
      passwordHash: userPassword,
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.USER,
      isEmailVerified: true,
    },
  });
  console.log(`✅ Test user: ${user.email}`);

  console.log('🎉 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
