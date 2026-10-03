/**
 * One-time script: attach the Services category + service product images.
 *
 * - Sets Category.imageUrl for the "Services" category
 * - Replaces any existing main ProductImage rows for the 3 services
 *   with ones pointing at the committed filenames
 *
 * Idempotent — safe to re-run.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORY_SLUG = 'services';
const CATEGORY_IMAGE = '/uploads/categories/services.jpg';

const SERVICES: Array<{ sku: string; filename: string }> = [
  { sku: 'SVC-SIM-001', filename: 'race-simulator.jpg' },
  { sku: 'SVC-PAINT-001', filename: 'helmet-painting.jpg' },
  { sku: 'SVC-TEAM-001', filename: 'team-building.jpg' },
];

async function main() {
  console.log('🔗 Linking services images...\n');

  // ---------- Category image ----------
  const category = await prisma.category.findUnique({ where: { slug: CATEGORY_SLUG } });
  if (!category) {
    console.warn(`⚠️  No category with slug "${CATEGORY_SLUG}" — skipping`);
  } else {
    await prisma.category.update({
      where: { id: category.id },
      data: { imageUrl: CATEGORY_IMAGE },
    });
    console.log(`✅ Category "${category.name}" ← ${CATEGORY_IMAGE}`);
  }

  // ---------- Product images ----------
  for (const { sku, filename } of SERVICES) {
    const product = await prisma.product.findUnique({
      where: { sku },
      include: { images: true },
    });

    if (!product) {
      console.warn(`⚠️  No product with SKU "${sku}" — skipping`);
      continue;
    }

    // Remove any existing main image (the admin-uploaded UUID one)
    if (product.images.length > 0) {
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      console.log(`   (cleared ${product.images.length} existing image row(s))`);
    }

    // Insert the deterministic main image
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: `/uploads/products/${filename}`,
        publicId: filename,
        isMain: true,
        displayOrder: 0,
      },
    });

    console.log(`✅ ${product.name} ← ${filename}`);
  }

  console.log('\n🎉 Done.');
}

main()
  .catch((e) => {
    console.error('❌ Linking failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
