/**
 * Skeleton Component
 *
 * Warm loading placeholder.
 */

import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-cream-300 dark:bg-forest-800/60', className)}
      {...props}
    />
  );
}
