/**
 * Badge Component
 *
 * Small status badge with semantic variants.
 * Used for order statuses, product availability, categories, etc.
 */

import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
