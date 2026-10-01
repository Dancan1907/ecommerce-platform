/**
 * One-time cleanup: remove users created by the E2E test suite.
 *
 * E2E tests register a fresh user each run with an email matching
 * `e2e-<timestamp>-<random>@example.test`. Nothing cleans them up,
 * so they accumulate in dev/prod DBs.
 *
 * Safe to re-run — reports what it deletes.
 *
 * Run:
 *   cd apps/backend
 *   npx ts-node prisma/cleanup-e2e-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up E2E test users...\n');

  // Match users created by e2e tests: e2e-<digits>-<digits>@example.test
  const e2eUsers = await prisma.user.findMany({
    where: { email: { endsWith: '@example.test' } },
    select: { id: true, email: true },
  });

  if (e2eUsers.length === 0) {
    console.log('✅ No E2E users found — nothing to do.');
    return;
  }

  console.log(`Found ${e2eUsers.length} E2E user(s):`);

  const ids = e2eUsers.map((u) => u.id);

  // Clear dependent rows first (should be none, but be safe)
  const carts = await prisma.cart.findMany({
    where: { userId: { in: ids } },
    select: { id: true },
  });
  for (const c of carts) {
    await prisma.cartItem.deleteMany({ where: { cartId: c.id } });
  }
  const cartsDeleted = await prisma.cart.deleteMany({
    where: { userId: { in: ids } },
  });
  const ordersDeleted = await prisma.order.deleteMany({
    where: { userId: { in: ids } },
  });
  const reviewsDeleted = await prisma.review.deleteMany({
    where: { userId: { in: ids } },
  });

  const usersDeleted = await prisma.user.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`  🗑️  Users:   ${usersDeleted.count}`);
  console.log(`  🗑️  Carts:   ${cartsDeleted.count}`);
  console.log(`  🗑️  Orders:  ${ordersDeleted.count}`);
  console.log(`  🗑️  Reviews: ${reviewsDeleted.count}`);
  console.log('\n🎉 Cleanup complete.');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
