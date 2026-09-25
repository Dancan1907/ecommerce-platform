/**
 * Custom 404 Page
 *
 * Rendered when a route doesn't match any page.
 */

import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-8xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        404
      </div>
      <h1 className="text-2xl md:text-3xl font-bold mb-3">Page not found</h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/">
          <Button size="lg" leftIcon={<Home className="h-4 w-4" />}>
            Back to Home
          </Button>
        </Link>
        <Link href="/products">
          <Button variant="secondary" size="lg" leftIcon={<Search className="h-4 w-4" />}>
            Browse Products
          </Button>
        </Link>
      </div>
    </div>
  );
}
