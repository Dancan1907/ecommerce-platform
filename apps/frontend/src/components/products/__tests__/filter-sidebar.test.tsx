/**
 * FilterSidebar Tests
 */

import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '@/test/test-utils';
import { FilterSidebar } from '../filter-sidebar';
import type { Category } from '@/types/product';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-2',
    name: 'Clothing',
    slug: 'clothing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('FilterSidebar', () => {
  const baseProps = {
    categories: mockCategories,
    filters: {},
    onChange: jest.fn(),
    onClear: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders search, categories, price, and sort controls', () => {
    renderWithProvider(<FilterSidebar {...baseProps} />);
    expect(screen.getByPlaceholderText(/search products/i)).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
    expect(screen.getByText(/price range/i)).toBeInTheDocument();
    expect(screen.getByText(/sort by/i)).toBeInTheDocument();
  });

  it('calls onChange when a category is clicked', () => {
    renderWithProvider(<FilterSidebar {...baseProps} />);
    fireEvent.click(screen.getByText('Electronics'));
    expect(baseProps.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'cat-1', page: 1 })
    );
  });

  it('renders "All Categories" as selected when no categoryId', () => {
    renderWithProvider(<FilterSidebar {...baseProps} filters={{}} />);
    const allBtn = screen.getByText('All Categories');
    expect(allBtn.className).toContain('bg-forest-800');
  });

  it('shows clear button when filters are active', () => {
    renderWithProvider(<FilterSidebar {...baseProps} filters={{ categoryId: 'cat-1' }} />);
    expect(screen.getByText(/clear all filters/i)).toBeInTheDocument();
  });

  it('hides clear button when no filters are active', () => {
    renderWithProvider(<FilterSidebar {...baseProps} filters={{}} />);
    expect(screen.queryByText(/clear all filters/i)).not.toBeInTheDocument();
  });

  it('calls onClear when clear button clicked', () => {
    renderWithProvider(<FilterSidebar {...baseProps} filters={{ categoryId: 'cat-1' }} />);
    fireEvent.click(screen.getByText(/clear all filters/i));
    expect(baseProps.onClear).toHaveBeenCalled();
  });
});
