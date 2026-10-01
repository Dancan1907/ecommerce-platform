'use client';

/**
 * Product Form Modal
 *
 * Reusable form for creating/editing products with translations.
 * Supports optional image upload via POST /products/:id/images.
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setImageFile(null);

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
      // Show existing main image as preview
      const mainImage = product.images?.find((img) => img.isMain) ?? product.images?.[0];
      setImagePreview(mainImage?.url ?? null);
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
      setImagePreview(null);
    }
  }, [isOpen, product, categories, reset]);

  // Cleanup preview URL on unmount or change
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

    // Basic validation
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

    // Preview
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

  async function uploadImage(productId: string, file: File) {
    const formData = new FormData();
    formData.append('images', file);
    await api.post(`/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async function onSubmit(data: ProductFormData) {
    setSubmitting(true);
    setError(null);

    try {
      if (isEditMode && product) {
        await api.put(`/products/${product.id}`, data);
        if (imageFile) {
          await uploadImage(product.id, imageFile);
        }
        toast.success(t('updatedToast'));
      } else {
        const res = await api.post('/products', data);
        const newProductId = res.data?.id;
        if (imageFile && newProductId) {
          await uploadImage(newProductId, imageFile);
        }
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

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-forest-800 dark:text-mint-200">
            Product Image
          </label>

          {imagePreview ? (
            <div className="flex items-start gap-3">
              <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-cream-300 dark:border-forest-700 bg-cream-100 dark:bg-forest-900/60">
                {/* Preview thumbnail — external URLs and blob: URLs may not be
                    compatible with next/image, so a plain img is intentional here. */}
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
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
              Click to upload product image
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
