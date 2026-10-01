/**
 * Card Component
 *
 * Warm cream cards (light) / charcoal-emerald (dark).
 * Refined borders + soft elevation for clear visual separation.
 *
 * Variants:
 *  - default: standard card
 *  - elevated: more prominent shadow (for hero, modals)
 *  - outlined: minimal shadow, prominent border
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

const variantClasses: Record<NonNullable<CardProps['variant']>, string> = {
  default:
    'border bg-white dark:bg-forest-900/50 ' +
    'border-cream-300 dark:border-emerald-900/40 ' +
    'shadow-soft hover:shadow-soft-lg ' +
    'dark:shadow-[0_4px_20px_-4px_rgba(16,185,129,0.05)] ' +
    'dark:hover:shadow-[0_12px_40px_-8px_rgba(16,185,129,0.12)]',

  elevated:
    'border bg-white dark:bg-forest-900/60 ' +
    'border-cream-300 dark:border-emerald-900/50 ' +
    'shadow-soft-lg dark:shadow-[0_12px_40px_-8px_rgba(16,185,129,0.10)] ' +
    'dark:hover:shadow-[0_16px_50px_-10px_rgba(16,185,129,0.18)]',

  outlined:
    'border-2 bg-white dark:bg-forest-900/30 ' +
    'border-cream-400 dark:border-emerald-900/60 ' +
    'shadow-none hover:shadow-soft',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl transition-all duration-300', variantClasses[variant], className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-serif text-lg font-semibold text-ink-900 dark:text-mint-100', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-ink-600 dark:text-mint-300', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
