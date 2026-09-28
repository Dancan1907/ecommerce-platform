/**
 * Textarea Component
 *
 * Multi-line text input with label, error, and consistent styling.
 */

import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? props.name ?? generatedId;
    const errorId = `${textareaId}-error`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-forest-800 dark:text-mint-200"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'flex min-h-24 w-full rounded-lg border px-3 py-2 text-sm',
            'bg-white dark:bg-forest-900/60',
            'border-cream-400 dark:border-forest-700',
            'placeholder:text-ink-400 dark:placeholder:text-mint-300/60',
            'text-ink-900 dark:text-mint-100',
            'transition-colors resize-y',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
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

Textarea.displayName = 'Textarea';
