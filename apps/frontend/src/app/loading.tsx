/**
 * Global Loading State
 *
 * Shown during route transitions when the next page is being prepared.
 */

import { Skeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      {/* Hero skeleton */}
      <div className="space-y-4 max-w-2xl mx-auto text-center">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
      </div>

      {/* Feature cards skeleton */}
      <div className="grid md:grid-cols-3 gap-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
