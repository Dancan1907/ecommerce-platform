/**
 * One-time cleanup script.
 *
 * Removes the legacy demo categories/products created by the old seed:
 *   - Categories: electronics, clothing
 *   - Products:   PROD-001 (Wireless Headphones), PROD-002 (Cotton T-Shirt)
 *
 * Safe to re-run — does nothing if the rows are already gone.
 * Does NOT touch users.
 *
 * Run with:
 *   cd apps/backend
 *   npx ts-node prisma/cleanup-demo-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up legacy demo data...\n');

  // -------- Products --------
  const productSkus = ['PROD-001', 'PROD-002'];
  for (const sku of productSkus) {
    const product = await prisma.product.findUnique({ where: { sku } });
    if (!product) {
      console.log(`⏭️  Product ${sku} — not found, skipping`);
      continue;
    }
    // Remove any cart items / order items that reference it (best-effort)
    await prisma.cartItem.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
    console.log(`🗑️  Deleted product ${sku} (${product.name})`);
  }

  // -------- Categories --------
  const categorySlugs = ['electronics', 'clothing'];
  for (const slug of categorySlugs) {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) {
      console.log(`⏭️  Category "${slug}" — not found, skipping`);
      continue;
    }
    // Check if any products still reference it
    const productCount = await prisma.product.count({
      where: { categoryId: category.id },
    });
    if (productCount > 0) {
      console.warn(`⚠️  Category "${slug}" still has ${productCount} product(s) — skipping delete`);
      continue;
    }
    await prisma.category.delete({ where: { id: category.id } });
    console.log(`🗑️  Deleted category "${slug}" (${category.name})`);
  }

  console.log('\n🎉 Cleanup done.');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
