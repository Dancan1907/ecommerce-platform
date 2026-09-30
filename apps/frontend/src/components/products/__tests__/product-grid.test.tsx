/**
 * ProductGrid Tests
 */

import { screen } from '@testing-library/react';
import { renderWithProvider } from '@/test/test-utils';
import { ProductGrid } from '../product-grid';
import type { Product } from '@/types/product';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, priority, sizes, ...rest }: any) => {
    void fill;
    void priority;
    void sizes;
    return <img {...rest} />;
  },
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/stores/cart-store', () => ({
  useCartStore: (sel: any) => sel({ addItem: jest.fn() }),
}));
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (sel: any) => sel({ isAuthenticated: true }),
}));

const mkProduct = (id: string, name: string): Product => ({
  id,
  name,
  slug: `slug-${id}`,
  description: 'desc',
  price: 1000,
  stockQuantity: 10,
  sku: `SKU-${id}`,
  isActive: true,
  categoryId: 'cat-1',
  sellerId: 'seller-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  images: [],
});

describe('ProductGrid', () => {
  it('renders all products', () => {
    renderWithProvider(
      <ProductGrid products={[mkProduct('1', 'Alpha'), mkProduct('2', 'Beta')]} />
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows default empty state', () => {
    renderWithProvider(<ProductGrid products={[]} />);
    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  it('shows custom empty message when provided', () => {
    renderWithProvider(<ProductGrid products={[]} emptyMessage="Nothing here, sorry!" />);
    expect(screen.getByText('Nothing here, sorry!')).toBeInTheDocument();
  });
});
