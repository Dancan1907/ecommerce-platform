/**
 * CartItemRow Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { CartItemRow } from '../cart-item-row';
import type { CartItem } from '@/stores/cart-store';

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

const mockUpdateItem = jest.fn().mockResolvedValue(true);
const mockRemoveItem = jest.fn().mockResolvedValue(true);

jest.mock('@/stores/cart-store', () => ({
  useCartStore: (sel: any) => sel({ updateItem: mockUpdateItem, removeItem: mockRemoveItem }),
}));

const mockItem: CartItem = {
  id: 'item-1',
  productId: 'prod-1',
  quantity: 2,
  product: {
    id: 'prod-1',
    name: 'Test Product',
    slug: 'test-product',
    price: 1500,
    stockQuantity: 10,
    isActive: true,
    images: [{ id: 'img-1', url: 'https://example.com/img.jpg' }],
  },
};

describe('CartItemRow', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders product name and price', () => {
    render(<CartItemRow item={mockItem} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getAllByText(/1,500/).length).toBeGreaterThan(0);
  });

  it('renders quantity', () => {
    render(<CartItemRow item={mockItem} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls updateItem when increase clicked', () => {
    render(<CartItemRow item={mockItem} />);
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    expect(mockUpdateItem).toHaveBeenCalledWith('prod-1', 3);
  });

  it('calls updateItem when decrease clicked', () => {
    render(<CartItemRow item={mockItem} />);
    fireEvent.click(screen.getByLabelText('Decrease quantity'));
    expect(mockUpdateItem).toHaveBeenCalledWith('prod-1', 1);
  });

  it('disables decrease at quantity 1', () => {
    render(<CartItemRow item={{ ...mockItem, quantity: 1 }} />);
    expect(screen.getByLabelText('Decrease quantity')).toBeDisabled();
  });

  it('disables increase at max stock', () => {
    render(
      <CartItemRow
        item={{
          ...mockItem,
          quantity: 10,
          product: { ...mockItem.product, stockQuantity: 10 },
        }}
      />
    );
    expect(screen.getByLabelText('Increase quantity')).toBeDisabled();
  });

  it('calls removeItem when trash clicked', () => {
    render(<CartItemRow item={mockItem} />);
    fireEvent.click(screen.getByLabelText('Remove Test Product'));
    expect(mockRemoveItem).toHaveBeenCalledWith('prod-1');
  });
});
