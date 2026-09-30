'use client';

/**
 * Admin Categories Page
 *
 * List, create, edit, and delete categories with translations.
 * Shows a thumbnail header per category when an image is set.
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, FolderTree, AlertCircle } from 'lucide-react';
import { Button, Card, Badge, Skeleton } from '@/components/ui';
import { CategoryFormModal } from '@/components/admin/category-form-modal';
import { ConfirmDeleteModal } from '@/components/admin/confirm-delete-modal';
import { api, extractErrorMessage } from '@/lib/api';
import { resolveImageUrl } from '@/lib/utils';
import type { Category } from '@/types/product';

export default function AdminCategoriesPage() {
  const t = useTranslations('admin.categories');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Category[]>('/categories');
      setCategories(res.data);
      setTotal(res.data.length);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  function openCreateModal() {
    setEditingCategory(null);
    setFormModalOpen(true);
  }

  function openEditModal(cat: Category) {
    setEditingCategory(cat);
    setFormModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <span className="label-caps mb-2 block">{t('eyebrow')}</span>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
            {t('title')}
          </h1>
          <p className="text-sm text-ink-600 dark:text-mint-300">{t('count', { count: total })}</p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
          {t('createButton')}
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/30">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 dark:bg-forest-900/60">
            <FolderTree className="h-8 w-8 text-forest-600 dark:text-emerald-500" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100 mb-2">
            {t('empty')}
          </h3>
          <p className="text-sm text-ink-600 dark:text-mint-300 mb-6">{t('emptyHint')}</p>
          <Button onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
            {t('createButton')}
          </Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="overflow-hidden flex flex-col">
              {/* Image header */}
              <div className="relative aspect-[16/9] bg-cream-100 dark:bg-forest-900">
                {cat.imageUrl ? (
                  // Plain <img> is intentional (blob preview / external URL)
                  <img
                    src={resolveImageUrl(cat.imageUrl)}
                    alt={cat.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-cream-400 dark:text-forest-700">
                    <FolderTree className="h-10 w-10" />
                  </div>
                )}
                {(cat.children?.length ?? 0) > 0 && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="neutral">
                      {t('subSuffix', { count: cat.children!.length })}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100 truncate">
                  {cat.name}
                </h3>
                <p className="text-xs text-ink-500 dark:text-mint-300/70 font-mono mt-0.5 mb-3 truncate">
                  /{cat.slug}
                </p>

                <p className="text-sm text-ink-600 dark:text-mint-300 line-clamp-2 mb-4 flex-1">
                  {cat.description || t('noDescription')}
                </p>

                <div className="flex items-center gap-1 justify-end pt-3 border-t border-cream-200 dark:border-forest-800">
                  <button
                    onClick={() => openEditModal(cat)}
                    aria-label={`Edit ${cat.name}`}
                    className="p-2 rounded-lg text-ink-600 dark:text-mint-300 hover:bg-forest-100 dark:hover:bg-forest-800 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingCategory(cat)}
                    aria-label={`Delete ${cat.name}`}
                    className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CategoryFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingCategory(null);
        }}
        onSuccess={loadCategories}
        category={editingCategory}
        categories={categories}
      />

      {deletingCategory && (
        <ConfirmDeleteModal
          isOpen={!!deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onSuccess={loadCategories}
          endpoint={`/categories/${deletingCategory.id}`}
          itemName={deletingCategory.name}
          itemType="Category"
          description={t('deleteConfirm', { name: deletingCategory.name })}
        />
      )}
    </div>
  );
}
