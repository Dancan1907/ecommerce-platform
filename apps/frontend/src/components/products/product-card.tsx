'use client';

/**
 * Product Card
 *
 * Reusable product card with translations.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { ShoppingCart, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Badge } from '@/components/ui';
import { formatKES, cn, resolveImageUrl } from '@/lib/utils';
import type { Product } from '@/types/product';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';

export interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addItem = useCartStore((s) => s.addItem);
  const [adding, setAdding] = useState(false);
  const t = useTranslations('products');

  const mainImage = product.images?.find((img) => img.isMain) ?? product.images?.[0] ?? null;

  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error(t('signInToAdd'));
      router.push('/login');
      return;
    }

    if (isOutOfStock) {
      toast.error(t('outOfStock'));
      return;
    }

    setAdding(true);
    const success = await addItem(product.id, 1);
    setAdding(false);

    if (success) {
      toast.success(t('addedToCart', { name: product.name }));
    } else {
      toast.error('Failed to add to cart');
    }
  }

  return (
    <Link href={`/products/${product.slug}`} className={cn('group block', className)}>
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-cream-100 dark:bg-forest-900">
          {mainImage ? (
            <Image
              src={resolveImageUrl(mainImage.url)}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-cream-400 dark:text-forest-700">
              <Package className="h-16 w-16" />
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute top-3 left-3">
              <Badge variant="danger">{t('outOfStock')}</Badge>
            </div>
          )}
          {isLowStock && !isOutOfStock && (
            <div className="absolute top-3 left-3">
              <Badge variant="warning">{t('lowStock', { count: product.stockQuantity })}</Badge>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={adding || isOutOfStock}
            aria-label={t('addToCart')}
            className={cn(
              'absolute bottom-3 right-3 h-10 w-10 rounded-full',
              'bg-emerald-600 text-white shadow-soft',
              'hover:bg-emerald-700 active:bg-emerald-800',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'flex items-center justify-center',
              'disabled:cursor-not-allowed disabled:bg-gray-400'
            )}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col flex-1">
          {product.category && (
            <span className="label-caps mb-1 text-[10px]">{product.category.name}</span>
          )}
          <h3 className="font-serif text-base font-semibold text-ink-900 dark:text-mint-100 line-clamp-2 mb-2">
            {product.name}
          </h3>
          <div className="mt-auto flex items-center justify-between">
            <span className="font-serif text-lg font-semibold text-forest-800 dark:text-emerald-400">
              {formatKES(product.price)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
