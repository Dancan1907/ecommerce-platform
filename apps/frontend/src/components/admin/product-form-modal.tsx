'use client';

/**
 * Product Form Modal
 *
 * Reusable form for creating/editing products with translations.
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Button, Input, Textarea, Select, Modal } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import type { Category, Product } from '@/types/product';

const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  stockQuantity: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  categoryId: z.string().uuid('Please select a category'),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

export interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
  categories: Category[];
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  categories,
}: ProductFormModalProps) {
  const isEditMode = !!product;
  const t = useTranslations('admin.products');
  const tCommon = useTranslations('admin.common');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stockQuantity: 0,
      sku: '',
      categoryId: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    if (product) {
      reset({
        name: product.name,
        description: product.description,
        price: Number(product.price),
        stockQuantity: product.stockQuantity,
        sku: product.sku,
        categoryId: product.categoryId,
        isActive: product.isActive,
      });
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        stockQuantity: 0,
        sku: '',
        categoryId: categories[0]?.id ?? '',
        isActive: true,
      });
    }
  }, [isOpen, product, categories, reset]);

  async function onSubmit(data: ProductFormData) {
    setSubmitting(true);
    setError(null);

    try {
      if (isEditMode && product) {
        await api.put(`/products/${product.id}`, data);
        toast.success(t('updatedToast'));
      } else {
        await api.post('/products', data);
        toast.success(t('createdToast'));
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
      toast.error(isEditMode ? t('updateFailed') : t('createFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('editTitle') : t('createTitle')}
      description={
        isEditMode ? t('editDescription', { name: product?.name ?? '' }) : t('createDescription')
      }
      size="lg"
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
          rows={4}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('formPrice')}
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.price?.message}
            {...register('price')}
          />
          <Input
            label={t('formStock')}
            type="number"
            placeholder="0"
            error={errors.stockQuantity?.message}
            {...register('stockQuantity')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('formSku')}
            type="text"
            placeholder={t('formSkuPlaceholder')}
            error={errors.sku?.message}
            {...register('sku')}
          />
          <Select
            label={t('formCategory')}
            error={errors.categoryId?.message}
            {...register('categoryId')}
          >
            <option value="">{t('formCategoryPlaceholder')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('isActive')}
            className="h-4 w-4 rounded border-cream-400 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-ink-700 dark:text-mint-300">{t('formActive')}</span>
        </label>

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
