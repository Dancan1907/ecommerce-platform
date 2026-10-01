'use client';

/**
 * Product Detail Page
 *
 * Individual product view with translations.
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { ChevronRight, Package, ShoppingCart, Minus, Plus, Store, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Badge, Card, Skeleton } from '@/components/ui';
import { formatKES, cn, resolveImageUrl } from '@/lib/utils';
import { fetchProductBySlug } from '@/lib/products';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import type { Product, ProductImage } from '@/types/product';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const t = useTranslations('products');

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    fetchProductBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        const main = data.images?.find((img) => img.isMain) ?? data.images?.[0] ?? null;
        setSelectedImage(main);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleAddToCart() {
    if (!product) return;

    if (!isAuthenticated) {
      toast.error(t('signInToAdd'));
      router.push(`/login?next=/products/${slug}`);
      return;
    }

    if (product.stockQuantity === 0) {
      toast.error(t('outOfStock'));
      return;
    }

    if (quantity > product.stockQuantity) {
      toast.error(t('lowStock', { count: product.stockQuantity }));
      return;
    }

    setAdding(true);
    const success = await addItem(product.id, quantity);
    setAdding(false);

    if (success) {
      toast.success(t('addedToCart', { name: product.name }));
    } else {
      toast.error('Failed to add to cart');
    }
  }

  if (loading) {
    return (
      <div className="container-page py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cream-200 dark:bg-forest-900/60">
          <Package className="h-10 w-10 text-forest-600 dark:text-emerald-500" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          {t('productNotFound')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-8">
          {t('productNotFoundDescription')}
        </p>
        <Link href="/products">
          <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>{t('backToProducts')}</Button>
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  return (
    <div className="container-page py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-ink-500 dark:text-mint-300/70">
        <Link href="/" className="hover:text-forest-700 dark:hover:text-emerald-400">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-forest-700 dark:hover:text-emerald-400">
          {t('title')}
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href={`/products?categoryId=${product.categoryId}`}
              className="hover:text-forest-700 dark:hover:text-emerald-400"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ink-900 dark:text-mint-100 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* LEFT: Image Gallery */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-cream-100 dark:bg-forest-900">
              {selectedImage ? (
                <Image
                  src={resolveImageUrl(selectedImage.url)}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-cream-400 dark:text-forest-700">
                  <Package className="h-24 w-24" />
                </div>
              )}
            </div>
          </Card>

          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-lg border-2 transition-all',
                    selectedImage?.id === img.id
                      ? 'border-emerald-600 dark:border-emerald-500'
                      : 'border-cream-300 dark:border-forest-800 hover:border-forest-500'
                  )}
                  aria-label={`View image ${img.displayOrder + 1}`}
                >
                  <Image
                    src={resolveImageUrl(img.url)}
                    alt={`${product.name} - view ${img.displayOrder + 1}`}
                    fill
                    sizes="100px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Product Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            {product.category && (
              <span className="label-caps text-[11px]">{product.category.name}</span>
            )}
            {isOutOfStock && <Badge variant="danger">{t('outOfStock')}</Badge>}
            {isLowStock && !isOutOfStock && (
              <Badge variant="warning">{t('lowStock', { count: product.stockQuantity })}</Badge>
            )}
            {!isOutOfStock && !isLowStock && <Badge variant="success">{t('inStock')}</Badge>}
          </div>

          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100 leading-tight">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-3">
            <span className="font-serif text-3xl md:text-4xl font-bold text-forest-800 dark:text-emerald-400">
              {formatKES(product.price)}
            </span>
          </div>

          <div>
            <h2 className="label-caps mb-2">{t('description')}</h2>
            <p className="text-ink-700 dark:text-mint-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cream-300 dark:border-forest-800">
            <div>
              <span className="label-caps mb-1 block text-[10px]">{t('sku')}</span>
              <span className="text-sm text-ink-700 dark:text-mint-300">{product.sku}</span>
            </div>
            {product.seller && (
              <div>
                <span className="label-caps mb-1 block text-[10px]">{t('seller')}</span>
                <span className="text-sm text-ink-700 dark:text-mint-300 flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" />
                  {product.seller.firstName} {product.seller.lastName}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-cream-300 dark:border-forest-800">
            <div className="flex items-center gap-4">
              <span className="label-caps">{t('quantity')}</span>
              <div className="flex items-center rounded-lg border border-cream-400 dark:border-forest-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  aria-label="Decrease quantity"
                  className="p-2.5 text-ink-700 dark:text-mint-300 hover:bg-cream-200 dark:hover:bg-forest-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-12 px-3 text-center font-medium text-ink-900 dark:text-mint-100">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                  disabled={quantity >= product.stockQuantity || isOutOfStock}
                  aria-label="Increase quantity"
                  className="p-2.5 text-ink-700 dark:text-mint-300 hover:bg-cream-200 dark:hover:bg-forest-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              disabled={isOutOfStock || adding}
              isLoading={adding}
              leftIcon={!adding ? <ShoppingCart className="h-5 w-5" /> : undefined}
            >
              {isOutOfStock ? t('outOfStock') : t('addToCart')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
