/**
 * Order Number Generator
 *
 * Generates human-readable order numbers like "ORD-2026-00001".
 * Uses the current year and a sequential per-year counter.
 *
 * IMPORTANT: Must be called inside a Prisma transaction to avoid
 * race conditions where two concurrent requests generate the same number.
 */

import { PrismaClient } from '@prisma/client';

/**
 * Prisma client type that works both with the full PrismaClient
 * and with the transaction client passed to `$transaction()` callbacks.
 */
type PrismaClientOrTx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export async function generateOrderNumber(prisma: PrismaClientOrTx): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;

  // Find the highest order number for the current year
  const lastOrder = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  });

  let nextNumber = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.replace(prefix, ''), 10);
    if (!isNaN(lastSequence)) {
      nextNumber = lastSequence + 1;
    }
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
}
