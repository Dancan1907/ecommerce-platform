/**
 * Skeleton Component
 *
 * Loading placeholder with pulse animation.
 * Used while data is being fetched to avoid layout shift.
 */

import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-700/50', className)}
      {...props}
    />
  );
}
