/**
 * CI-only seed — creates the admin user and a minimal F1 catalog
 * so E2E tests have data to exercise.
 *
 * Runs only in GitHub Actions. Env-driven credentials — no secrets
 * committed. Idempotent (upsert) so re-runs are safe.
 *
 * NOT for production.
 */

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const rawEmail = process.env.CI_ADMIN_EMAIL;
  const rawPassword = process.env.CI_ADMIN_PASSWORD;

  if (!rawEmail || !rawPassword) {
    throw new Error('CI_ADMIN_EMAIL and CI_ADMIN_PASSWORD must be set');
  }

  // Trim whitespace/newlines that can sneak in from CI secrets.
  // GitHub's secret editor sometimes preserves a trailing newline
  // when pasting; the browser trims whitespace on input fields,
  // but the seed does not — so the DB would store a different
  // value than the test sends (email length 25 vs 23 → 401).
  const email = rawEmail.trim();
  const password = rawPassword.trim();

  if (email !== rawEmail) {
    console.warn(
      `⚠️  CI_ADMIN_EMAIL had ${rawEmail.length - email.length} whitespace char(s) — trimmed`
    );
  }
  if (password !== rawPassword) {
    console.warn(`⚠️  CI_ADMIN_PASSWORD had whitespace — trimmed`);
  }

  console.log(`Seeding admin: email length ${email.length}, password length ${password.length}`);

  // ---------- Admin user ----------
  const hash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash },
    create: {
      email,
      passwordHash: hash,
      firstName: 'CI',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      isEmailVerified: true,
    },
  });
  console.log(`✅ CI admin ready: ${admin.email}`);

  // ---------- Categories ----------
  const categories = [
    {
      slug: 'helmets-headgear',
      name: 'Helmets & Headgear',
      description: 'Racing helmets, caps, and head protection for every lap.',
      imageUrl: '/uploads/categories/helmets-headgear.jpg',
    },
    {
      slug: 'apparel',
      name: 'Apparel',
      description: 'Race jackets, polos, hoodies, and team wear.',
      imageUrl: '/uploads/categories/apparel.jpg',
    },
    {
      slug: 'accessories',
      name: 'Accessories',
      description: 'Gloves, caps, bottles, and paddock essentials.',
      imageUrl: '/uploads/categories/accessories.jpg',
    },
  ];

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, imageUrl: c.imageUrl },
      create: c,
    });
    catMap[c.slug] = cat.id;
    console.log(`✅ Category: ${cat.name}`);
  }

  // ---------- Products ----------
  const products = [
    {
      sku: 'RS-HELM-001',
      name: 'Blue Energy Racing Helmet',
      slug: 'blue-energy-racing-helmet',
      price: 12500,
      stockQuantity: 200,
      description: 'Full-face racing helmet in electric blue with breathable padding.',
      categorySlug: 'helmets-headgear',
      image: '/uploads/products/blue-energy-helmet.jpg',
    },
    {
      sku: 'RS-HELM-002',
      name: 'Silver Arrow Full-Face Helmet',
      slug: 'silver-arrow-full-face-helmet',
      price: 14000,
      stockQuantity: 170,
      description: 'Matte silver full-face helmet with anti-fog visor.',
      categorySlug: 'helmets-headgear',
      image: '/uploads/products/silver-arrow-helmet.jpg',
    },
    {
      sku: 'RS-HELM-003',
      name: 'Scuderia Red Racing Helmet',
      slug: 'scuderia-red-racing-helmet',
      price: 13200,
      stockQuantity: 150,
      description: 'Classic red racing helmet with premium ventilation.',
      categorySlug: 'helmets-headgear',
      image: '/uploads/products/scuderia-red-helmet.jpg',
    },
    {
      sku: 'RS-APP-001',
      name: 'Papaya Orange Race Jacket',
      slug: 'papaya-orange-race-jacket',
      price: 6800,
      stockQuantity: 100,
      description: 'Lightweight race jacket in papaya orange.',
      categorySlug: 'apparel',
      image: '/uploads/products/papaya-orange-jacket.jpg',
    },
    {
      sku: 'RS-APP-002',
      name: 'Silver Arrow Team Polo',
      slug: 'silver-arrow-team-polo',
      price: 3500,
      stockQuantity: 120,
      description: 'Breathable team polo in silver-grey.',
      categorySlug: 'apparel',
      image: '/uploads/products/silver-arrow-polo.jpg',
    },
    {
      sku: 'RS-APP-003',
      name: 'Blue Energy Hoodie',
      slug: 'blue-energy-hoodie',
      price: 5200,
      stockQuantity: 140,
      description: 'Heavyweight hoodie in deep racing blue.',
      categorySlug: 'apparel',
      image: '/uploads/products/blue-energy-hoodie.jpg',
    },
    {
      sku: 'RS-ACC-001',
      name: 'Red Racing Gloves',
      slug: 'red-racing-gloves',
      price: 2200,
      stockQuantity: 180,
      description: 'Race-spec gloves in red with grip-enhancing palm.',
      categorySlug: 'accessories',
      image: '/uploads/products/red-racing-gloves.jpg',
    },
    {
      sku: 'RS-ACC-002',
      name: 'Checkered Flag Cap',
      slug: 'checkered-flag-cap',
      price: 1800,
      stockQuantity: 176,
      description: 'Adjustable cap with embroidered checkered flag.',
      categorySlug: 'accessories',
      image: '/uploads/products/checkered-flag-cap.jpg',
    },
    {
      sku: 'RS-ACC-003',
      name: 'Carbon Fiber Water Bottle',
      slug: 'carbon-fiber-water-bottle',
      price: 1200,
      stockQuantity: 139,
      description: 'Insulated 750ml bottle with carbon-fiber texture.',
      categorySlug: 'accessories',
      image: '/uploads/products/carbon-bottle.jpg',
    },
    {
      sku: 'RS-ACC-004',
      name: 'Team Radio Headset (Replica)',
      slug: 'team-radio-headset-replica',
      price: 4500,
      stockQuantity: 169,
      description: "Paddock-style headset replica. Collector's piece.",
      categorySlug: 'accessories',
      image: '/uploads/products/team-radio-headset.jpg',
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        stockQuantity: p.stockQuantity,
        categoryId: catMap[p.categorySlug],
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        stockQuantity: p.stockQuantity,
        sku: p.sku,
        categoryId: catMap[p.categorySlug],
        sellerId: admin.id,
        isActive: true,
      },
    });

    // Main image — upsert by (productId, displayOrder)
    await prisma.productImage.upsert({
      where: {
        productId_displayOrder: { productId: product.id, displayOrder: 0 },
      },
      update: { url: p.image, isMain: true },
      create: {
        productId: product.id,
        url: p.image,
        publicId: p.slug,
        isMain: true,
        displayOrder: 0,
      },
    });

    console.log(`✅ Product: ${product.name}`);
  }

  console.log('🎉 CI seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ CI seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
