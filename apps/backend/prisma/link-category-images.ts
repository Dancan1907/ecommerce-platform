/**
 * One-time script: Link category images to categories.
 *
 * Reads categories from the DB, matches them to files in
 * uploads/categories/ by slug, and sets category.imageUrl.
 *
 * Run with:
 *   cd apps/backend
 *   npx ts-node prisma/link-category-images.ts
 *
 * Safe to re-run — skips categories that already have an imageUrl.
 */

import { PrismaClient } from '@prisma/client';
import { existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

// Map each category slug to its image filename in uploads/categories/
const SLUG_TO_IMAGE: Record<string, string> = {
  'helmets-headgear': 'helmets-headgear.jpg',
  apparel: 'apparel.jpg',
  accessories: 'accessories.jpg',
};

async function main() {
  console.log('🔗 Linking category images...\n');

  const uploadsDir = join(process.cwd(), 'uploads', 'categories');

  for (const [slug, filename] of Object.entries(SLUG_TO_IMAGE)) {
    const category = await prisma.category.findUnique({ where: { slug } });

    if (!category) {
      console.warn(`⚠️  No category with slug "${slug}" — skipping`);
      continue;
    }

    if (category.imageUrl) {
      console.log(`⏭️  ${category.name} — already has an image, skipping`);
      continue;
    }

    const filePath = join(uploadsDir, filename);
    if (!existsSync(filePath)) {
      console.warn(`⚠️  ${category.name} — image file missing: ${filename}`);
      continue;
    }

    const imageUrl = `/uploads/categories/${filename}`;

    await prisma.category.update({
      where: { id: category.id },
      data: { imageUrl },
    });

    console.log(`✅ ${category.name}  ←  ${filename}`);
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
