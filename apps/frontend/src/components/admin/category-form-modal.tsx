'use client';

/**
 * Category Form Modal
 *
 * Reusable form for creating/editing categories.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Button, Input, Textarea, Select, Modal } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import type { Category } from '@/types/product';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  parentId: z.string().optional().or(z.literal('')),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: Category | null;
  categories: Category[]; // for parent selection
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSuccess,
  category,
  categories,
}: CategoryFormModalProps) {
  const isEditMode = !!category;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', parentId: '' },
  });

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    if (category) {
      reset({
        name: category.name,
        description: category.description ?? '',
        parentId: category.parentId ?? '',
      });
    } else {
      reset({ name: '', description: '', parentId: '' });
    }
  }, [isOpen, category, reset]);

  async function onSubmit(data: CategoryFormData) {
    setSubmitting(true);
    setError(null);

    // Clean up empty strings
    const payload = {
      name: data.name,
      description: data.description || undefined,
      parentId: data.parentId || undefined,
    };

    try {
      if (isEditMode && category) {
        await api.put(`/categories/${category.id}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/categories', payload);
        toast.success('Category created');
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
      toast.error(isEditMode ? 'Failed to update' : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  }

  // Filter out the current category from parent options (can't be own parent)
  const parentOptions = categories.filter((c) => c.id !== category?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Category' : 'Create Category'}
      description={isEditMode ? `Update "${category?.name}"` : 'Add a new product category'}
      closeOnBackdrop={false}
    >
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Category Name"
          type="text"
          placeholder="e.g., Electronics"
          error={errors.name?.message}
          autoFocus
          {...register('name')}
        />

        <Textarea
          label="Description"
          placeholder="Briefly describe this category"
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        <Select
          label="Parent Category (optional)"
          error={errors.parentId?.message}
          {...register('parentId')}
        >
          <option value="">None (top-level category)</option>
          {parentOptions.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>

        <div className="flex justify-end gap-3 pt-4 border-t border-cream-200 dark:border-forest-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            {isEditMode ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
