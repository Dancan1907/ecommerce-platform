/**
 * Select Component
 *
 * Styled dropdown with label, error, and consistent look.
 */

import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? props.name ?? generatedId;
    const errorId = `${selectId}-error`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-forest-800 dark:text-mint-200"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'flex h-11 w-full rounded-lg border px-3 py-2 text-sm',
            'bg-white dark:bg-forest-900/60',
            'border-cream-400 dark:border-forest-700',
            'text-ink-900 dark:text-mint-100',
            'transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p id={errorId} className="text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {!error && hint && <p className="text-xs text-ink-500 dark:text-mint-300/70">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
