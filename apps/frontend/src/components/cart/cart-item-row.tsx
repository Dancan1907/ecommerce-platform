'use client';

/**
 * Cart Item Row
 *
 * Single row in the cart: image, name, price, quantity controls, subtotal, remove.
 * Inline quantity updates with optimistic feedback.
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { formatKES, cn } from '@/lib/utils';
import { useCartStore, type CartItem } from '@/stores/cart-store';

export interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const [pending, setPending] = useState<'update' | 'remove' | null>(null);

  const mainImage = item.product.images?.[0]?.url ?? null;
  const lineTotal = Number(item.product.price) * item.quantity;
  const isAtMaxStock = item.quantity >= item.product.stockQuantity;

  async function handleQuantityChange(newQty: number) {
    if (newQty < 1) return;
    if (newQty > item.product.stockQuantity) {
      toast.error(`Only ${item.product.stockQuantity} units available`);
      return;
    }
    setPending('update');
    const success = await updateItem(item.productId, newQty);
    setPending(null);
    if (!success) toast.error('Failed to update quantity');
  }

  async function handleRemove() {
    setPending('remove');
    const success = await removeItem(item.productId);
    setPending(null);
    if (success) {
      toast.success(`${item.product.name} removed`);
    } else {
      toast.error('Failed to remove item');
    }
  }

  return (
    <div className="flex gap-4 py-5 border-b border-cream-300 dark:border-forest-800 last:border-0">
      {/* Image */}
      <Link
        href={`/products/${item.product.slug}`}
        className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-cream-100 dark:bg-forest-900"
      >
        {mainImage ? (
          <Image
            src={mainImage}
            alt={item.product.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-cream-400 dark:text-forest-700">
            <Package className="h-8 w-8" />
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-4 mb-2">
          <div className="min-w-0">
            <Link
              href={`/products/${item.product.slug}`}
              className="font-serif text-base font-semibold text-ink-900 dark:text-mint-100 hover:text-forest-700 dark:hover:text-emerald-400 line-clamp-2"
            >
              {item.product.name}
            </Link>
            <p className="text-sm text-ink-600 dark:text-mint-300 mt-0.5">
              {formatKES(item.product.price)} each
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={pending === 'remove'}
            aria-label={`Remove ${item.product.name}`}
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Quantity controls */}
          <div className="flex items-center rounded-lg border border-cream-400 dark:border-forest-700 overflow-hidden">
            <button
              type="button"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1 || pending === 'update'}
              aria-label="Decrease quantity"
              className={cn(
                'p-2 text-ink-700 dark:text-mint-300 transition-colors',
                'hover:bg-cream-200 dark:hover:bg-forest-800',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-8 px-2 text-center text-sm font-medium text-ink-900 dark:text-mint-100">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isAtMaxStock || pending === 'update'}
              aria-label="Increase quantity"
              className={cn(
                'p-2 text-ink-700 dark:text-mint-300 transition-colors',
                'hover:bg-cream-200 dark:hover:bg-forest-800',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Line total */}
          <span className="font-serif text-lg font-semibold text-forest-800 dark:text-emerald-400">
            {formatKES(lineTotal)}
          </span>
        </div>

        {/* Stock warnings */}
        {isAtMaxStock && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Max stock reached ({item.product.stockQuantity} available)
          </p>
        )}
      </div>
    </div>
  );
}
