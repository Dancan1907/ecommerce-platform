'use client';

/**
 * Confirm Delete Modal
 *
 * Reusable confirmation dialog for destructive actions.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** API endpoint to DELETE (e.g., /products/123) */
  endpoint: string;
  /** Item name for display */
  itemName: string;
  /** What kind of item (product, category, etc.) */
  itemType: string;
  /** Optional description override */
  description?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  endpoint,
  itemName,
  itemType,
  description,
}: ConfirmDeleteModalProps) {
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    setSubmitting(true);
    try {
      await api.delete(endpoint);
      toast.success(`${itemType} deleted`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${itemType}?`}
      size="sm"
      closeOnBackdrop={false}
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40 flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p className="text-sm text-ink-700 dark:text-mint-300">
            {description ?? (
              <>
                You&apos;re about to delete{' '}
                <strong className="text-ink-900 dark:text-mint-100">{itemName}</strong>. This action
                cannot be undone.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          isLoading={submitting}
          leftIcon={!submitting ? <Trash2 className="h-4 w-4" /> : undefined}
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
}
