/**
 * Badge Component
 *
 * Small status badge with warm, artisanal variants.
 */

import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
  neutral: 'bg-cream-300 text-forest-800 dark:bg-forest-800 dark:text-mint-200',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
