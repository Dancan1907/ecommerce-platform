/**
 * One-time cleanup: remove two demo users and their owned data.
 *
 * Targets:
 *   - admin@ecommerce.com
 *   - user@ecommerce.com
 *
 * Deletes in dependency order:
 *   OrderItem → Order → CartItem → Cart → Review → Product (if seller) → User
 *
 * Does NOT touch:
 *   - dancankalerwa@gmail.com
 *   - maxverstappen@ecommerce.com
 *   - any other user, order, product, or review
 *
 * Safe to re-run — reports what's missing and exits cleanly.
 *
 * Run with:
 *   cd apps/backend
 *   npx ts-node prisma/cleanup-demo-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_EMAILS = ['admin@ecommerce.com', 'user@ecommerce.com'];

async function main() {
  console.log('🧹 Cleaning up demo users...\n');
  console.log(`Targets: ${TARGET_EMAILS.join(', ')}\n`);

  // -------- Look up the two users --------
  const users = await prisma.user.findMany({
    where: { email: { in: TARGET_EMAILS } },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (users.length === 0) {
    console.log('✅ No matching users found — nothing to do.');
    return;
  }

  const userIds = users.map((u) => u.id);
  console.log(`Found ${users.length} user(s) to remove:`);
  users.forEach((u) => console.log(`  • ${u.email} (${u.firstName} ${u.lastName})`));
  console.log('');

  // -------- 1. Orders + their items --------
  const orders = await prisma.order.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, orderNumber: true },
  });
  console.log(`Found ${orders.length} order(s) to remove.`);

  for (const order of orders) {
    const itemsDeleted = await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    console.log(`  🗑️  Deleted order ${order.orderNumber} (+${itemsDeleted.count} items)`);
  }

  // -------- 2. Carts + their items --------
  const carts = await prisma.cart.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  console.log(`\nFound ${carts.length} cart(s) to remove.`);

  for (const cart of carts) {
    const itemsDeleted = await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.delete({ where: { id: cart.id } });
    console.log(`  🗑️  Deleted cart (+${itemsDeleted.count} items)`);
  }

  // -------- 3. Reviews --------
  const reviewsDeleted = await prisma.review.deleteMany({
    where: { userId: { in: userIds } },
  });
  if (reviewsDeleted.count > 0) {
    console.log(`\n🗑️  Deleted ${reviewsDeleted.count} review(s).`);
  }

  // -------- 4. Products they own (if any) --------
  // NOTE: only deletes products where the seller is one of the target users.
  // If a product has order history from other users, deletion may fail and
  // you'll see the error — that's intentional (don't silently orphan orders).
  const ownedProducts = await prisma.product.findMany({
    where: { sellerId: { in: userIds } },
    select: { id: true, name: true },
  });
  if (ownedProducts.length > 0) {
    console.log(`\nFound ${ownedProducts.length} product(s) owned by target users:`);
    for (const p of ownedProducts) {
      console.log(`  ⚠️  ${p.name} — skipping (reassign or delete via admin UI)`);
    }
  }

  // -------- 5. Finally, the users --------
  for (const email of TARGET_EMAILS) {
    try {
      const deleted = await prisma.user.delete({ where: { email } });
      console.log(`\n🗑️  Deleted user: ${deleted.email}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`\n⚠️  Could not delete ${email}: ${msg}`);
    }
  }

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
