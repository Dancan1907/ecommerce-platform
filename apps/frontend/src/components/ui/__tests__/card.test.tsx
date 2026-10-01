/**
 * Card Component Tests
 */

import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card', () => {
  it('renders with title and description', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Product Name</CardTitle>
          <CardDescription>Short description</CardDescription>
        </CardHeader>
        <CardContent>Body content</CardContent>
      </Card>
    );

    expect(screen.getByRole('heading', { name: /product name/i })).toBeInTheDocument();
    expect(screen.getByText(/short description/i)).toBeInTheDocument();
    expect(screen.getByText(/body content/i)).toBeInTheDocument();
  });

  it('renders footer content', () => {
    render(
      <Card>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
