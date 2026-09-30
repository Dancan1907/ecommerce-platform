'use client';

/**
 * Admin Products Page
 *
 * List, create, edit, and delete products with translations.
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, Pencil, Trash2, Package, AlertCircle } from 'lucide-react';
import { Button, Input, Card, Badge, Skeleton } from '@/components/ui';
import { ProductFormModal } from '@/components/admin/product-form-modal';
import { ConfirmDeleteModal } from '@/components/admin/confirm-delete-modal';
import { api, extractErrorMessage } from '@/lib/api';
import { formatKES, truncate } from '@/lib/utils';
import { fetchCategories } from '@/lib/products';
import type { Category, PaginatedProducts, Product } from '@/types/product';

export default function AdminProductsPage() {
  const t = useTranslations('admin.products');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PaginatedProducts>(
        `/products?limit=100${search ? `&search=${encodeURIComponent(search)}` : ''}`
      );
      setProducts(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  function openCreateModal() {
    setEditingProduct(null);
    setFormModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
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
          <p className="text-sm text-ink-600 dark:text-mint-300">
            {t('countSuffix', { count: total })}
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
          {t('createButton')}
        </Button>
      </div>

      <Card className="p-4">
        <Input
          type="text"
          placeholder={t('searchPlaceholder')}
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/30">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 dark:bg-forest-900/60">
              <Package className="h-8 w-8 text-forest-600 dark:text-emerald-500" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100 mb-2">
              {search ? t('noResults') : t('empty')}
            </h3>
            <p className="text-sm text-ink-600 dark:text-mint-300 mb-6">
              {search ? t('noResultsHint') : t('emptyHint')}
            </p>
            {!search && (
              <Button onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
                {t('createButton')}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 dark:bg-forest-900/40">
                <tr className="border-b border-cream-200 dark:border-forest-800">
                  <th className="text-left px-4 py-3 label-caps text-[10px] font-semibold">
                    {t('columns.product')}
                  </th>
                  <th className="text-left px-4 py-3 label-caps text-[10px] font-semibold">
                    {t('columns.sku')}
                  </th>
                  <th className="text-left px-4 py-3 label-caps text-[10px] font-semibold">
                    {t('columns.category')}
                  </th>
                  <th className="text-right px-4 py-3 label-caps text-[10px] font-semibold">
                    {t('columns.price')}
                  </th>
                  <th className="text-right px-4 py-3 label-caps text-[10px] font-semibold">
                    {t('columns.stock')}
                  </th>
                  <th className="text-right px-4 py-3 label-caps text-[10px] font-semibold">
                    {t('columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-cream-200 dark:border-forest-800 last:border-0 hover:bg-cream-50 dark:hover:bg-forest-900/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-ink-900 dark:text-mint-100">
                          {truncate(product.name, 40)}
                        </p>
                        {!product.isActive && (
                          <Badge variant="neutral" className="mt-1 text-[10px]">
                            {t('inactive')}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600 dark:text-mint-300/70 font-mono text-xs">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 text-ink-600 dark:text-mint-300">
                      {product.category?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-ink-900 dark:text-mint-100">
                      {formatKES(product.price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge
                        variant={
                          product.stockQuantity === 0
                            ? 'danger'
                            : product.stockQuantity <= 5
                              ? 'warning'
                              : 'success'
                        }
                      >
                        {product.stockQuantity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(product)}
                          aria-label={`Edit ${product.name}`}
                          className="p-2 rounded-lg text-ink-600 dark:text-mint-300 hover:bg-forest-100 dark:hover:bg-forest-800 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(product)}
                          aria-label={`Delete ${product.name}`}
                          className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ProductFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={loadProducts}
        product={editingProduct}
        categories={categories}
      />

      {deletingProduct && (
        <ConfirmDeleteModal
          isOpen={!!deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onSuccess={loadProducts}
          endpoint={`/products/${deletingProduct.id}`}
          itemName={deletingProduct.name}
          itemType="Product"
        />
      )}
    </div>
  );
}
