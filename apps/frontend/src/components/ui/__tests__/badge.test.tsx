/**
 * Badge Component Tests
 */

import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  it('renders text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies success variant classes', () => {
    render(<Badge variant="success">Delivered</Badge>);
    const badge = screen.getByText('Delivered');
    expect(badge.className).toContain('bg-emerald-100');
  });

  it('applies danger variant classes', () => {
    render(<Badge variant="danger">Cancelled</Badge>);
    const badge = screen.getByText('Cancelled');
    expect(badge.className).toContain('bg-red-100');
  });

  it('applies warning variant classes', () => {
    render(<Badge variant="warning">Pending</Badge>);
    const badge = screen.getByText('Pending');
    expect(badge.className).toContain('bg-amber-100');
  });
});
