/**
 * CartSummary Tests
 */

import { screen } from '@testing-library/react';
import { renderWithProvider } from '@/test/test-utils';
import { CartSummary } from '../cart-summary';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...rest }: any) => <a {...rest}>{children}</a>,
}));

describe('CartSummary', () => {
  it('renders subtotal and shipping', () => {
    renderWithProvider(<CartSummary subtotal={5000} itemCount={2} />);
    expect(screen.getByText('KSh 5,000')).toBeInTheDocument();
    expect(screen.getByText('KSh 250')).toBeInTheDocument();
    expect(screen.getByText('KSh 5,250')).toBeInTheDocument();
  });

  it('hides shipping when cart is empty', () => {
    renderWithProvider(<CartSummary subtotal={0} itemCount={0} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders checkout button', () => {
    renderWithProvider(<CartSummary subtotal={5000} itemCount={2} />);
    expect(screen.getByText(/proceed to checkout/i)).toBeInTheDocument();
  });

  it('disables checkout button when cart empty', () => {
    renderWithProvider(<CartSummary subtotal={0} itemCount={0} />);
    const btn = screen.getByRole('button', { name: /proceed to checkout/i });
    expect(btn).toBeDisabled();
  });
});
