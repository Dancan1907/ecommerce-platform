/**
 * Product Grid
 *
 * Responsive grid layout for product cards.
 * Handles empty state with a friendly message.
 */

import { PackageSearch } from 'lucide-react';
import { ProductCard } from './product-card';
import type { Product } from '@/types/product';
import { cn } from '@/lib/utils';

export interface ProductGridProps {
  products: Product[];
  className?: string;
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  className,
  emptyMessage = 'No products found',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cream-200 dark:bg-forest-900/60">
          <PackageSearch className="h-10 w-10 text-forest-600 dark:text-emerald-500" />
        </div>
        <h3 className="font-serif text-xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-sm text-ink-600 dark:text-mint-300 max-w-md">
          Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6', className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
