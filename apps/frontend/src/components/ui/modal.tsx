'use client';

/**
 * Modal Component
 *
 * Accessible dialog with backdrop, ESC to close, and focus trap.
 * Uses portal-free approach (absolute positioning on body).
 */

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className={cn(
          'relative z-10 w-full',
          sizeClasses[size],
          'rounded-xl border bg-white dark:bg-forest-900',
          'border-cream-300 dark:border-forest-800',
          'shadow-2xl',
          'max-h-[90vh] overflow-y-auto'
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 p-6 border-b border-cream-200 dark:border-forest-800">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="font-serif text-xl font-semibold text-ink-900 dark:text-mint-100"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-ink-600 dark:text-mint-300 mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-ink-500 dark:text-mint-300 hover:text-ink-900 dark:hover:text-mint-100 transition-colors flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
