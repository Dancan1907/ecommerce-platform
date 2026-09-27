'use client';

/**
 * Product Listing Page
 *
 * Combines filter sidebar + product grid + pagination.
 * Syncs filter state with URL query params for shareable links.
 */

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton, Badge } from '@/components/ui';
import { ProductGrid } from '@/components/products/product-grid';
import { Pagination } from '@/components/products/pagination';
import { FilterSidebar, type FilterState } from '@/components/products/filter-sidebar';
import { fetchCategories, fetchProducts } from '@/lib/products';
import type { Category, Product } from '@/types/product';

// ============================================
// INNER COMPONENT (uses useSearchParams)
// ============================================
function ProductListingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // ============================================
  // FILTERS FROM URL
  // ============================================
  const filters: FilterState = {
    categoryId: searchParams.get('categoryId') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sortBy: (searchParams.get('sortBy') as FilterState['sortBy']) ?? undefined,
    sortOrder: (searchParams.get('sortOrder') as FilterState['sortOrder']) ?? undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
  };

  const updateUrl = useCallback(
    (next: FilterState) => {
      const params = new URLSearchParams();
      if (next.categoryId) params.set('categoryId', next.categoryId);
      if (next.search) params.set('search', next.search);
      if (next.minPrice !== undefined) params.set('minPrice', String(next.minPrice));
      if (next.maxPrice !== undefined) params.set('maxPrice', String(next.maxPrice));
      if (next.sortBy) params.set('sortBy', next.sortBy);
      if (next.sortOrder) params.set('sortOrder', next.sortOrder);
      if (next.page && next.page > 1) params.set('page', String(next.page));
      const query = params.toString();
      router.push(query ? `/products?${query}` : '/products');
    },
    [router]
  );

  const clearFilters = useCallback(() => {
    router.push('/products');
  }, [router]);

  // ============================================
  // FETCH CATEGORIES (once)
  // ============================================
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // ============================================
  // FETCH PRODUCTS (when filters change)
  // ============================================
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchProducts({
      categoryId: filters.categoryId,
      search: filters.search,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: filters.page,
      limit: 12,
      isActive: true,
    })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data);
        setTotalPages(res.totalPages);
        setTotal(res.total);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setTotalPages(1);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    filters.categoryId,
    filters.search,
    filters.minPrice,
    filters.maxPrice,
    filters.sortBy,
    filters.sortOrder,
    filters.page,
  ]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="container-page py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <span className="label-caps mb-2 block">Shop</span>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          All Products
        </h1>
        {!loading && (
          <p className="text-sm text-ink-600 dark:text-mint-300">
            {total} {total === 1 ? 'product' : 'products'} found
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        {/* Filters */}
        <FilterSidebar
          categories={categories}
          filters={filters}
          onChange={updateUrl}
          onClear={clearFilters}
        />

        {/* Products */}
        <div>
          {/* Active filter badges */}
          {(filters.categoryId || filters.search) && !loading && (
            <div className="mb-6 flex flex-wrap gap-2">
              {filters.categoryId && (
                <Badge variant="neutral">
                  Category:{' '}
                  {categories.find((c) => c.id === filters.categoryId)?.name ?? 'Filtered'}
                </Badge>
              )}
              {filters.search && (
                <Badge variant="neutral">Search: &ldquo;{filters.search}&rdquo;</Badge>
              )}
            </div>
          )}

          {loading ? (
            <ProductGridSkeleton />
          ) : (
            <>
              <ProductGrid products={products} emptyMessage="No products match your filters" />
              {totalPages > 1 && (
                <Pagination
                  className="mt-10"
                  page={filters.page ?? 1}
                  totalPages={totalPages}
                  onPageChange={(page) => updateUrl({ ...filters, page })}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton shown while products are loading.
 */
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// PAGE WRAPPER (Suspense for useSearchParams)
// ============================================
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-8 md:py-12">
          <Skeleton className="h-12 w-64 mb-4" />
          <ProductGridSkeleton />
        </div>
      }
    >
      <ProductListingContent />
    </Suspense>
  );
}
