'use client';

/**
 * Confirm Delete Modal
 *
 * Reusable destructive action confirmation with translations.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  endpoint: string;
  itemName: string;
  itemType: string;
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
  const t = useTranslations('admin.common');
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    setSubmitting(true);
    try {
      await api.delete(endpoint);
      toast.success(t('deleteSuccess', { type: itemType }));
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
      title={t('confirmDelete', { type: itemType })}
      size="sm"
      closeOnBackdrop={false}
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40 flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p className="text-sm text-ink-700 dark:text-mint-300">
            {description ?? t('deleteWarning', { name: itemName })}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          {t('cancel')}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          isLoading={submitting}
          leftIcon={!submitting ? <Trash2 className="h-4 w-4" /> : undefined}
        >
          {t('delete')}
        </Button>
      </div>
    </Modal>
  );
}
