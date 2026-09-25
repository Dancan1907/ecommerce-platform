/**
 * Button Component
 *
 * Artisanal theme button with multiple variants:
 *  - default  : Emerald green (primary CTA)
 *  - secondary: Cream/forest outline
 *  - outline  : Border only
 *  - ghost    : No background
 *  - danger   : Destructive red
 */

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  // Emerald CTA — matches "Shop Now" in reference
  default:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-soft hover:shadow-soft-lg',

  // Secondary — cream/forest outline (matches "Browse Categories")
  secondary:
    'border-2 border-forest-800 dark:border-emerald-500 text-forest-800 dark:text-emerald-400 bg-transparent hover:bg-forest-800/5 dark:hover:bg-emerald-500/10',

  // Outline — neutral border
  outline:
    'border border-cream-400 dark:border-forest-700 text-ink-800 dark:text-mint-200 bg-transparent hover:bg-cream-100 dark:hover:bg-forest-900',

  // Ghost — minimal
  ghost:
    'bg-transparent text-ink-700 dark:text-mint-300 hover:bg-cream-100 dark:hover:bg-forest-900',

  // Danger
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-soft',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-base',
  icon: 'h-10 w-10 p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
