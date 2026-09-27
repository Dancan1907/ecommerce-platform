/**
 * CartSummary Tests
 */

import { render, screen } from '@testing-library/react';
import { CartSummary } from '../cart-summary';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...rest }: any) => <a {...rest}>{children}</a>,
}));

describe('CartSummary', () => {
  it('renders subtotal and shipping', () => {
    render(<CartSummary subtotal={5000} itemCount={2} />);
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
    expect(screen.getByText(/250/)).toBeInTheDocument();
    expect(screen.getByText(/5,250/)).toBeInTheDocument();
  });

  it('hides shipping when cart is empty', () => {
    render(<CartSummary subtotal={0} itemCount={0} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders checkout button', () => {
    render(<CartSummary subtotal={5000} itemCount={2} />);
    expect(screen.getByText(/proceed to checkout/i)).toBeInTheDocument();
  });

  it('disables checkout button when cart empty', () => {
    render(<CartSummary subtotal={0} itemCount={0} />);
    const btn = screen.getByRole('button', { name: /proceed to checkout/i });
    expect(btn).toBeDisabled();
  });
});
