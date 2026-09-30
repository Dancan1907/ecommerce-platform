/**
 * One-time cleanup: remove two demo users and their owned data.
 *
 * Targets:
 *   - admin@ecommerce.com   (its products are reassigned first)
 *   - user@ecommerce.com
 *
 * Strategy:
 *   1. Reassign products owned by admin@ecommerce.com to the real
 *      admin (dancankalerwa@gmail.com) — otherwise the FK RESTRICT on
 *      Product.sellerId blocks user deletion.
 *   2. Delete orders, order items, carts, cart items, reviews.
 *   3. Delete the two users.
 *
 * Does NOT touch:
 *   - dancankalerwa@gmail.com (real admin — takes ownership of products)
 *   - maxverstappen@ecommerce.com
 *   - any other data
 *
 * Safe to re-run.
 *
 * Run with:
 *   cd apps/backend
 *   npx ts-node prisma/cleanup-demo-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_EMAILS = ['admin@ecommerce.com', 'user@ecommerce.com'];
const NEW_SELLER_EMAIL = 'dancankalerwa@gmail.com';

async function main() {
  console.log('🧹 Cleaning up demo users...\n');
  console.log(`Targets:      ${TARGET_EMAILS.join(', ')}`);
  console.log(`New seller:   ${NEW_SELLER_EMAIL}\n`);

  // -------- Look up new seller (must exist) --------
  const newSeller = await prisma.user.findUnique({
    where: { email: NEW_SELLER_EMAIL },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  if (!newSeller) {
    console.error(`❌ New seller ${NEW_SELLER_EMAIL} not found. Aborting.`);
    process.exit(1);
  }
  console.log(
    `Found new seller: ${newSeller.email} (${newSeller.firstName} ${newSeller.lastName})\n`
  );

  // -------- Look up target users --------
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

  // -------- 1. Reassign products owned by target users --------
  const ownedProducts = await prisma.product.findMany({
    where: { sellerId: { in: userIds } },
    select: { id: true, name: true },
  });

  if (ownedProducts.length > 0) {
    console.log(`🔁 Reassigning ${ownedProducts.length} product(s) to ${NEW_SELLER_EMAIL}:`);
    await prisma.product.updateMany({
      where: { sellerId: { in: userIds } },
      data: { sellerId: newSeller.id },
    });
    ownedProducts.forEach((p) => console.log(`   ↪ ${p.name}`));
    console.log('');
  } else {
    console.log('ℹ️  No products to reassign.\n');
  }

  // -------- 2. Orders + their items --------
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

  // -------- 3. Carts + their items --------
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

  // -------- 4. Reviews --------
  const reviewsDeleted = await prisma.review.deleteMany({
    where: { userId: { in: userIds } },
  });
  if (reviewsDeleted.count > 0) {
    console.log(`\n🗑️  Deleted ${reviewsDeleted.count} review(s).`);
  }

  // -------- 5. Finally, the users --------
  console.log('');
  for (const email of TARGET_EMAILS) {
    try {
      const deleted = await prisma.user.delete({ where: { email } });
      console.log(`🗑️  Deleted user: ${deleted.email}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`⚠️  Could not delete ${email}: ${msg}`);
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
