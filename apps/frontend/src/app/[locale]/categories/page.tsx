/**
 * Categories Page
 *
 * Shows all product categories as a navigable grid.
 * Clicking a category goes to its filtered products page.
 */

import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';
import { Card } from '@/components/ui';
import { fetchCategoryTree } from '@/lib/products';
import type { Category } from '@/types/product';

export const revalidate = 60; // Cache for 60s

export default async function CategoriesPage() {
  let categories: Category[];

  try {
    categories = await fetchCategoryTree();
  } catch {
    categories = [];
  }

  return (
    <div className="container-page py-12">
      {/* Header */}
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <span className="label-caps mb-3 block">Explore</span>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-ink-900 dark:text-mint-100 mb-4">
          Shop by Category
        </h1>
        <p className="text-ink-600 dark:text-mint-300">
          Browse our curated collections of local treasures.
        </p>
      </div>

      {/* Categories */}
      {categories.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cream-200 dark:bg-forest-900/60">
            <Package className="h-10 w-10 text-forest-600 dark:text-emerald-500" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
            No categories yet
          </h2>
          <p className="text-sm text-ink-600 dark:text-mint-300">
            Categories will appear here once they&apos;re added.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Category Card
 *
 * Visual card with a graceful gradient placeholder.
 * Falls back to a gradient + icon if no category image is provided.
 */
function CategoryCard({ category }: { category: Category }) {
  const hasChildren = (category.children?.length ?? 0) > 0;

  return (
    <Link href={`/categories/${category.slug}`} className="group block">
      <Card className="overflow-hidden h-full">
        {/* Gradient background placeholder */}
        <div className="relative aspect-[16/9] bg-gradient-to-br from-forest-700 via-forest-800 to-forest-900 dark:from-forest-800 dark:via-forest-900 dark:to-forest-950">
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <Package className="h-20 w-20 text-cream-200" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Category name overlay */}
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="font-serif text-2xl font-semibold text-cream-100 mb-1">
              {category.name}
            </h2>
            {hasChildren && (
              <p className="text-xs text-cream-200/70">
                {category.children!.length}{' '}
                {category.children!.length === 1 ? 'subcategory' : 'subcategories'}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex items-center justify-between">
          <p className="text-sm text-ink-600 dark:text-mint-300 line-clamp-2">
            {category.description ?? 'Explore our selection'}
          </p>
          <ArrowRight className="h-5 w-5 text-forest-700 dark:text-emerald-500 transition-transform group-hover:translate-x-1 flex-shrink-0 ml-2" />
        </div>
      </Card>
    </Link>
  );
}
