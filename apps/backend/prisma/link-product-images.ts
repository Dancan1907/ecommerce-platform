/**
 * One-time script: Link existing product images to products.
 *
 * Reads products from the DB, matches them to files in
 * uploads/products/ by SKU slug, and creates ProductImage rows.
 *
 * Run with:
 *   cd apps/backend
 *   npx ts-node prisma/link-product-images.ts
 *
 * Safe to re-run — it skips products that already have a main image.
 */

import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

// Map each SKU to its image filename in uploads/products/
const SKU_TO_IMAGE: Record<string, string> = {
  'RS-HELM-001': 'blue-energy-helmet.jpg',
  'RS-HELM-002': 'silver-arrow-helmet.jpg',
  'RS-HELM-003': 'scuderia-red-helmet.jpg',
  'RS-APP-001': 'papaya-orange-jacket.jpg',
  'RS-APP-002': 'silver-arrow-polo.jpg',
  'RS-APP-003': 'blue-energy-hoodie.jpg',
  'RS-ACC-001': 'red-racing-gloves.jpg',
  'RS-ACC-002': 'checkered-flag-cap.jpg',
  'RS-ACC-003': 'carbon-bottle.jpg',
  'RS-ACC-004': 'team-radio-headset.jpg',
};

async function main() {
  console.log('🔗 Linking product images...\n');

  const uploadsDir = join(process.cwd(), 'uploads', 'products');

  for (const [sku, filename] of Object.entries(SKU_TO_IMAGE)) {
    const product = await prisma.product.findUnique({
      where: { sku },
      include: { images: true },
    });

    if (!product) {
      console.warn(`⚠️  Skipping ${sku} — no product found with that SKU`);
      continue;
    }

    // Skip if already has a main image
    if (product.images.some((img) => img.isMain)) {
      console.log(`⏭️  ${product.name} — already has a main image, skipping`);
      continue;
    }

    // Verify file exists on disk
    const filePath = join(uploadsDir, filename);
    if (!existsSync(filePath)) {
      console.warn(`⚠️  ${product.name} — image file missing: ${filename}`);
      continue;
    }

    const url = `/uploads/products/${filename}`;

    await prisma.productImage.create({
      data: {
        url,
        publicId: filename,
        isMain: true,
        displayOrder: 0,
        productId: product.id,
      },
    });

    console.log(`✅ ${product.name}  ←  ${filename}`);
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
