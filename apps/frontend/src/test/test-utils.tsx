/**
 * Test Utilities
 *
 * Wraps components with NextIntlClientProvider so components that call
 * useTranslations() can be rendered in tests without a real i18n setup.
 */

import { NextIntlClientProvider } from 'next-intl';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

const messages = {
  products: {
    title: 'All Products',
    found_one: '{count} product found',
    found_other: '{count} products found',
    noResults: 'No products found',
    noResultsDescription: 'Try adjusting your filters or search terms.',
    outOfStock: 'Out of Stock',
    lowStock: 'Only {count} left',
    inStock: 'In Stock',
    addToCart: 'Add to Cart',
    quantity: 'Quantity',
    search: 'Search',
    searchPlaceholder: 'Search products…',
    categories: 'Categories',
    allCategories: 'All Categories',
    priceRange: 'Price Range (KES)',
    min: 'Min',
    max: 'Max',
    applyRange: 'Apply Range',
    currentRange: 'Current: {min} – {max}',
    sortBy: 'Sort By',
    sort: {
      newest: 'Newest first',
      oldest: 'Oldest first',
      priceAsc: 'Price: Low to High',
      priceDesc: 'Price: High to Low',
      nameAsc: 'Name: A–Z',
      nameDesc: 'Name: Z–A',
    },
    clearFilters: 'Clear all filters',
    filters: 'Filters',
    filtersActive: 'Filters (active)',
    showResults: 'Show results',
    signInToAdd: 'Please sign in to add items to your cart',
    addedToCart: '{name} added to cart',
  },
  cart: {
    title: 'Shopping Cart',
    empty: 'Your cart is empty',
    emptyDescription: "Looks like you haven't added anything yet.",
    startShopping: 'Start Shopping',
    continueShopping: 'Continue shopping',
    summary: 'Order Summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    total: 'Total',
    checkout: 'Proceed to Checkout',
    itemCount_one: '{count} item',
    itemCount_other: '{count} items',
    subtotalWithCount: 'Subtotal ({count} items)',
    each: '{price} each',
    maxStockReached: 'Max stock reached ({count} available)',
    itemRemoved: '{name} removed',
    updateFailed: 'Failed to update quantity',
    removeFailed: 'Failed to remove item',
    removeItem: 'Remove {name}',
    decreaseQuantity: 'Decrease quantity',
    increaseQuantity: 'Increase quantity',
    itemsInCart: '{count} items in your cart',
    shippingCalculated: 'Shipping calculated at checkout',
  },
  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Try Again',
    back: 'Back',
    search: 'Search',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    close: 'Close',
  },
};

export function renderWithProvider(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  });
}

// Re-export everything from @testing-library/react so tests can import
// { screen, fireEvent, renderWithProvider } from a single place if desired.
export * from '@testing-library/react';
