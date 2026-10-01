/**
 * Input Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../input';

describe('Input', () => {
  it('renders with a label', () => {
    render(<Input label="Email" placeholder="you@example.com" />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(<Input label="Name" onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders left icon when provided', () => {
    render(<Input leftIcon={<span data-testid="left-icon">L</span>} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders right icon when provided', () => {
    render(<Input rightIcon={<span data-testid="right-icon">R</span>} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    render(<Input label="Name" disabled />);
    expect(screen.getByLabelText(/name/i)).toBeDisabled();
  });
});
