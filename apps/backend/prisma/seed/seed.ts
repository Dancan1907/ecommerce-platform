/**
 * Database Seeding Script
 * Populates the database with initial test data
 * Run with: npx prisma db seed
 */

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
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
  console.log(`✅ Created admin user: ${admin.email}`);

  // Create test user
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
  console.log(`✅ Created test user: ${user.email}`);

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
    },
  });
  console.log(`✅ Created category: ${electronics.name}`);

  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
    },
  });
  console.log(`✅ Created category: ${clothing.name}`);

  // Create sample products
  const product1 = await prisma.product.upsert({
    where: { sku: 'PROD-001' },
    update: {},
    create: {
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description: 'Premium noise-cancelling headphones with 30-hour battery life',
      price: 99.99,
      stockQuantity: 50,
      sku: 'PROD-001',
      categoryId: electronics.id,
      sellerId: admin.id,
      isActive: true,
    },
  });
  console.log(`✅ Created product: ${product1.name}`);

  const product2 = await prisma.product.upsert({
    where: { sku: 'PROD-002' },
    update: {},
    create: {
      name: 'Cotton T-Shirt',
      slug: 'cotton-t-shirt',
      description: 'Comfortable 100% cotton t-shirt, available in multiple colors',
      price: 24.99,
      stockQuantity: 100,
      sku: 'PROD-002',
      categoryId: clothing.id,
      sellerId: admin.id,
      isActive: true,
    },
  });
  console.log(`✅ Created product: ${product2.name}`);

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
