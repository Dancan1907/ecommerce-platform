'use client';

/**
 * Error Boundary
 *
 * Catches runtime errors in any route segment.
 * Must be a Client Component.
 */

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to an error reporting service in production
    // eslint-disable-next-line no-console
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-full bg-red-100 dark:bg-red-500/20 p-6">
        <AlertTriangle className="h-16 w-16 text-red-600 dark:text-red-400" />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold mb-3">Something went wrong</h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
        We&apos;ve encountered an unexpected error. Try again or head back to the home page.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" onClick={reset} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Try Again
        </Button>
        <Link href="/">
          <Button variant="secondary" size="lg" leftIcon={<Home className="h-4 w-4" />}>
            Back to Home
          </Button>
        </Link>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 max-w-2xl text-left w-full">
          <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            Error details (dev only)
          </summary>
          <pre className="mt-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs overflow-auto">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}
