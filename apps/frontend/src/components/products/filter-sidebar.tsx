'use client';

/**
 * Filter Sidebar
 *
 * Category filter, price range, and search controls.
 * Managed via controlled props for URL syncing.
 */

import { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { cn, formatKES } from '@/lib/utils';
import type { Category } from '@/types/product';

export interface FilterState {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'createdAt' | 'price' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
}

export interface FilterSidebarProps {
  categories: Category[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onClear: () => void;
  className?: string;
}

export function FilterSidebar({
  categories,
  filters,
  onChange,
  onClear,
  className,
}: FilterSidebarProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? '');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Refs hold the latest props without retriggering the debounce effect
  const filtersRef = useRef(filters);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    filtersRef.current = filters;
    onChangeRef.current = onChange;
  }, [filters, onChange]);

  // Debounce search input → commit to parent after 400ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = filtersRef.current;
      if (searchInput !== (current.search ?? '')) {
        onChangeRef.current({
          ...current,
          search: searchInput || undefined,
          page: 1,
        });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const hasActiveFilters =
    !!filters.categoryId ||
    !!filters.search ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined;

  function applyPriceRange() {
    onChange({
      ...filters,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: 1,
    });
  }

  const content = (
    <div className="space-y-6">
      {/* ============================================
          SEARCH
          ============================================ */}
      <div>
        <label className="label-caps mb-3 block">Search</label>
        <Input
          type="text"
          placeholder="Search products…"
          leftIcon={<Search className="h-4 w-4" />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          rightIcon={
            searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="pointer-events-auto text-forest-500 dark:text-mint-300 hover:text-forest-800"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : undefined
          }
        />
      </div>

      {/* ============================================
          CATEGORIES
          ============================================ */}
      <div>
        <label className="label-caps mb-3 block">Categories</label>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onChange({ ...filters, categoryId: undefined, page: 1 })}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                !filters.categoryId
                  ? 'bg-forest-800 text-cream-200 dark:bg-emerald-600 dark:text-white'
                  : 'text-ink-700 dark:text-mint-300 hover:bg-cream-200 dark:hover:bg-forest-900'
              )}
            >
              All Categories
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => onChange({ ...filters, categoryId: cat.id, page: 1 })}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  filters.categoryId === cat.id
                    ? 'bg-forest-800 text-cream-200 dark:bg-emerald-600 dark:text-white'
                    : 'text-ink-700 dark:text-mint-300 hover:bg-cream-200 dark:hover:bg-forest-900'
                )}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ============================================
          PRICE RANGE
          ============================================ */}
      <div>
        <label className="label-caps mb-3 block">Price Range (KES)</label>
        <div className="space-y-3">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <Button variant="outline" size="sm" className="w-full" onClick={applyPriceRange}>
            Apply Range
          </Button>
          {filters.minPrice !== undefined && (
            <p className="text-xs text-ink-500 dark:text-mint-300/70">
              Current: {formatKES(filters.minPrice)} –{' '}
              {filters.maxPrice ? formatKES(filters.maxPrice) : '∞'}
            </p>
          )}
        </div>
      </div>

      {/* ============================================
          SORT
          ============================================ */}
      <div>
        <label className="label-caps mb-3 block">Sort By</label>
        <select
          value={`${filters.sortBy ?? 'createdAt'}:${filters.sortOrder ?? 'desc'}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split(':') as [
              'createdAt' | 'price' | 'name',
              'asc' | 'desc',
            ];
            onChange({ ...filters, sortBy, sortOrder, page: 1 });
          }}
          className="w-full rounded-lg border border-cream-400 dark:border-forest-700 bg-white dark:bg-forest-900/60 px-3 py-2 text-sm text-ink-900 dark:text-mint-100"
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="price:asc">Price: Low to High</option>
          <option value="price:desc">Price: High to Low</option>
          <option value="name:asc">Name: A–Z</option>
          <option value="name:desc">Name: Z–A</option>
        </select>
      </div>

      {/* ============================================
          CLEAR
          ============================================ */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="w-full" onClick={onClear}>
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden w-full mb-4 flex items-center justify-center gap-2 rounded-lg border border-cream-400 dark:border-forest-700 bg-white dark:bg-forest-900/40 px-4 py-2.5 text-sm font-medium text-ink-700 dark:text-mint-200"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters{hasActiveFilters ? ' (active)' : ''}
      </button>

      {/* Desktop sidebar */}
      <Card className={cn('hidden lg:block p-6 h-fit sticky top-24', className)}>{content}</Card>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-cream-100 dark:bg-forest-950 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-semibold">Filters</h2>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close filters"
                className="text-ink-600 dark:text-mint-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {content}
            <Button className="w-full mt-6" onClick={() => setMobileOpen(false)}>
              Show results
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
