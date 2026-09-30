/**
 * ProductCard Tests
 */

import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '@/test/test-utils';
import { ProductCard } from '../product-card';
import type { Product } from '@/types/product';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock next/image (renders as img)
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // Strip Next.js-specific props so they don't hit the DOM
    const { fill, priority, sizes, ...rest } = props;
    void fill;
    void priority;
    void sizes;
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock cart store
const mockAddItem = jest.fn().mockResolvedValue(true);
jest.mock('@/stores/cart-store', () => ({
  useCartStore: (selector: any) => selector({ addItem: mockAddItem }),
}));

// Mock auth store
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: any) => selector({ isAuthenticated: true }),
}));

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Test Headphones',
  slug: 'test-headphones',
  description: 'A test product',
  price: 45999,
  stockQuantity: 10,
  sku: 'TEST-001',
  isActive: true,
  categoryId: 'cat-1',
  sellerId: 'seller-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  images: [
    {
      id: 'img-1',
      url: 'https://example.com/image.jpg',
      publicId: 'test',
      isMain: true,
      displayOrder: 0,
    },
  ],
  category: { id: 'cat-1', name: 'Electronics', slug: 'electronics' },
};

describe('ProductCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders product name and formatted price', () => {
    renderWithProvider(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Headphones')).toBeInTheDocument();
    expect(screen.getByText(/45,999/)).toBeInTheDocument();
  });

  it('renders category label', () => {
    renderWithProvider(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('renders main image', () => {
    renderWithProvider(<ProductCard product={mockProduct} />);
    const img = screen.getByAltText('Test Headphones');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('shows Out of Stock badge when stock is zero', () => {
    renderWithProvider(<ProductCard product={{ ...mockProduct, stockQuantity: 0 }} />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('shows Low Stock badge when stock is 5 or less', () => {
    renderWithProvider(<ProductCard product={{ ...mockProduct, stockQuantity: 3 }} />);
    expect(screen.getByText(/Only 3 left/)).toBeInTheDocument();
  });

  it('calls addItem when quick-add button is clicked', async () => {
    renderWithProvider(<ProductCard product={mockProduct} />);
    const button = screen.getByRole('button', {
      name: /add test headphones to cart/i,
    });
    fireEvent.click(button);
    expect(mockAddItem).toHaveBeenCalledWith('prod-1', 1);
  });

  it('shows fallback icon when no image', () => {
    renderWithProvider(<ProductCard product={{ ...mockProduct, images: [] }} />);
    expect(screen.queryByAltText('Test Headphones')).not.toBeInTheDocument();
  });
});
