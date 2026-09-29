'use client';

/**
 * Category Products Page
 *
 * Shows all products within a specific category.
 * Reuses the ProductGrid component from the products module.
 */

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { ProductGrid } from '@/components/products/product-grid';
import { fetchCategoryBySlug, fetchProducts } from '@/lib/products';
import type { Category, Product } from '@/types/product';

export default function CategoryProductsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    Promise.all([fetchCategoryBySlug(slug), fetchProducts({ limit: 100, isActive: true })])
      .then(([categoryData, productsData]) => {
        if (cancelled) return;
        setCategory(categoryData);
        // Filter by categoryId client-side (backend supports it, but we already have data)
        const filtered = productsData.data.filter((p) => p.categoryId === categoryData.id);
        setProducts(filtered);
        setTotal(filtered.length);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ============================================
  // LOADING
  // ============================================
  if (loading) {
    return (
      <div className="container-page py-12">
        <Skeleton className="h-8 w-40 mb-4" />
        <Skeleton className="h-12 w-96 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================
  // NOT FOUND
  // ============================================
  if (notFound || !category) {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cream-200 dark:bg-forest-900/60">
          <Package className="h-10 w-10 text-forest-600 dark:text-emerald-500" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          Category not found
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-8">
          The category you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/categories">
          <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>Back to categories</Button>
        </Link>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="container-page py-8 md:py-12">
      {/* Back link */}
      <Link
        href="/categories"
        className="inline-flex items-center gap-1.5 text-sm text-ink-600 dark:text-mint-300 hover:text-forest-700 dark:hover:text-emerald-400 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All categories
      </Link>

      {/* Header */}
      <div className="mb-10">
        <span className="label-caps mb-2 block">Category</span>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-ink-600 dark:text-mint-300 max-w-2xl">{category.description}</p>
        )}
        <p className="text-sm text-ink-500 dark:text-mint-300/70 mt-2">
          {total} {total === 1 ? 'product' : 'products'}
        </p>
      </div>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="rounded-full border border-cream-400 dark:border-forest-700 px-4 py-1.5 text-sm text-ink-700 dark:text-mint-200 hover:border-forest-700 dark:hover:border-emerald-500 hover:bg-cream-100 dark:hover:bg-forest-900 transition-colors"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* Products */}
      <ProductGrid products={products} emptyMessage={`No products in ${category.name} yet`} />
    </div>
  );
}
