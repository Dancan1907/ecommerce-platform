'use client';

/**
 * Category Form Modal
 *
 * Reusable form for creating/editing categories with translations.
 * Supports optional image upload via POST /categories/:id/image.
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertCircle, ImagePlus, X } from 'lucide-react';
import { Button, Input, Textarea, Select, Modal } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import { resolveImageUrl } from '@/lib/utils';
import type { Category } from '@/types/product';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  imageUrl: z.string().optional().or(z.literal('')),
  parentId: z.string().optional().or(z.literal('')),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: Category | null;
  categories: Category[];
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSuccess,
  category,
  categories,
}: CategoryFormModalProps) {
  const isEditMode = !!category;
  const t = useTranslations('admin.categories');
  const tCommon = useTranslations('admin.common');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', imageUrl: '', parentId: '' },
  });

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setImageFile(null);

    if (category) {
      reset({
        name: category.name,
        description: category.description ?? '',
        imageUrl: category.imageUrl ?? '',
        parentId: category.parentId ?? '',
      });
      setImagePreview(category.imageUrl ?? null);
    } else {
      reset({ name: '', description: '', imageUrl: '', parentId: '' });
      setImagePreview(null);
    }
  }, [isOpen, category, reset]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError(null);
    setImageFile(file);

    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadImage(categoryId: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post(`/categories/${categoryId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  async function onSubmit(data: CategoryFormData) {
    setSubmitting(true);
    setError(null);

    const payload = {
      name: data.name,
      description: data.description || undefined,
      imageUrl: data.imageUrl || undefined,
      parentId: data.parentId || undefined,
    };

    try {
      if (isEditMode && category) {
        await api.put(`/categories/${category.id}`, payload);
        if (imageFile) {
          await uploadImage(category.id, imageFile);
        }
        toast.success(t('updatedToast'));
      } else {
        const res = await api.post('/categories', payload);
        const newCategoryId = res.data?.id;
        if (imageFile && newCategoryId) {
          await uploadImage(newCategoryId, imageFile);
        }
        toast.success(t('createdToast'));
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

  const parentOptions = categories.filter((c) => c.id !== category?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('editTitle') : t('createTitle')}
      description={
        isEditMode ? t('editDescription', { name: category?.name ?? '' }) : t('createDescription')
      }
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
          label={t('formName')}
          type="text"
          placeholder={t('formNamePlaceholder')}
          error={errors.name?.message}
          autoFocus
          {...register('name')}
        />

        <Textarea
          label={t('formDescription')}
          placeholder={t('formDescriptionPlaceholder')}
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-forest-800 dark:text-mint-200">
            Category Image
          </label>

          {imagePreview ? (
            <div className="flex items-start gap-3">
              <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-cream-300 dark:border-forest-700 bg-cream-100 dark:bg-forest-900/60">
                {/* Preview thumbnail — using a plain img because the preview may
    be a blob: URL that next/image can't handle */}
                <img
                  src={
                    imagePreview.startsWith('blob:') ? imagePreview : resolveImageUrl(imagePreview)
                  }
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 text-sm">
                <p className="text-ink-700 dark:text-mint-300">
                  {imageFile ? imageFile.name : 'Current image'}
                </p>
                {imageFile && (
                  <p className="text-xs text-ink-500 dark:text-mint-300/70 mt-0.5">
                    {(imageFile.size / 1024).toFixed(0)} KB
                  </p>
                )}
                <button
                  type="button"
                  onClick={clearImage}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  <X className="h-3 w-3" />
                  {imageFile ? 'Remove new image' : 'Clear preview'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-cream-400 dark:border-forest-700 py-6 text-sm text-ink-600 dark:text-mint-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
            >
              <ImagePlus className="h-5 w-5" />
              Click to upload category image
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-xs text-ink-500 dark:text-mint-300/70">
            JPG, PNG, GIF, or WebP. Max 5MB.
          </p>
        </div>

        <Select label={t('formParent')} error={errors.parentId?.message} {...register('parentId')}>
          <option value="">{t('formParentNone')}</option>
          {parentOptions.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>

        <div className="flex justify-end gap-3 pt-4 border-t border-cream-200 dark:border-forest-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            {tCommon('cancel')}
          </Button>
          <Button type="submit" isLoading={submitting}>
            {isEditMode ? t('submitEdit') : t('submitCreate')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
