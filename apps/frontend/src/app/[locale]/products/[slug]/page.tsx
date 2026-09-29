'use client';

/**
 * Product Detail Page
 *
 * Individual product view with:
 *  - Image gallery (main + thumbnails)
 *  - Product info (name, category, SKU, description)
 *  - Price + stock indicator
 *  - Quantity selector + Add to cart
 *  - Seller info
 */

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { ChevronRight, Package, ShoppingCart, Minus, Plus, Store, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Badge, Card, Skeleton } from '@/components/ui';
import { formatKES, cn } from '@/lib/utils';
import { fetchProductBySlug } from '@/lib/products';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import type { Product, ProductImage } from '@/types/product';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // ============================================
  // FETCH PRODUCT
  // ============================================
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

  // ============================================
  // HANDLERS
  // ============================================
  async function handleAddToCart() {
    if (!product) return;

    if (!isAuthenticated) {
      toast.error('Please sign in to add items to your cart');
      router.push(`/login?next=/products/${slug}`);
      return;
    }

    if (product.stockQuantity === 0) {
      toast.error('Product is out of stock');
      return;
    }

    if (quantity > product.stockQuantity) {
      toast.error(`Only ${product.stockQuantity} units available`);
      return;
    }

    setAdding(true);
    const success = await addItem(product.id, quantity);
    setAdding(false);

    if (success) {
      toast.success(`${quantity} × ${product.name} added to cart`);
    } else {
      toast.error('Failed to add to cart');
    }
  }

  // ============================================
  // LOADING STATE
  // ============================================
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

  // ============================================
  // NOT FOUND
  // ============================================
  if (notFound || !product) {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cream-200 dark:bg-forest-900/60">
          <Package className="h-10 w-10 text-forest-600 dark:text-emerald-500" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          Product not found
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-8">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/products">
          <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>Back to products</Button>
        </Link>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
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
          Products
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
        {/* ============================================
            LEFT: IMAGE GALLERY
            ============================================ */}
        <div className="space-y-4">
          {/* Main image */}
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-cream-100 dark:bg-forest-900">
              {selectedImage ? (
                <Image
                  src={selectedImage.url}
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

          {/* Thumbnails */}
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
                    src={img.url}
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

        {/* ============================================
            RIGHT: PRODUCT INFO
            ============================================ */}
        <div className="space-y-6">
          {/* Category + Stock */}
          <div className="flex items-center gap-3">
            {product.category && (
              <span className="label-caps text-[11px]">{product.category.name}</span>
            )}
            {isOutOfStock && <Badge variant="danger">Out of Stock</Badge>}
            {isLowStock && !isOutOfStock && (
              <Badge variant="warning">Only {product.stockQuantity} left</Badge>
            )}
            {!isOutOfStock && !isLowStock && <Badge variant="success">In Stock</Badge>}
          </div>

          {/* Name */}
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100 leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-3xl md:text-4xl font-bold text-forest-800 dark:text-emerald-400">
              {formatKES(product.price)}
            </span>
          </div>

          {/* Description */}
          <div>
            <h2 className="label-caps mb-2">Description</h2>
            <p className="text-ink-700 dark:text-mint-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* SKU + Seller */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cream-300 dark:border-forest-800">
            <div>
              <span className="label-caps mb-1 block text-[10px]">SKU</span>
              <span className="text-sm text-ink-700 dark:text-mint-300">{product.sku}</span>
            </div>
            {product.seller && (
              <div>
                <span className="label-caps mb-1 block text-[10px]">Seller</span>
                <span className="text-sm text-ink-700 dark:text-mint-300 flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" />
                  {product.seller.firstName} {product.seller.lastName}
                </span>
              </div>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          <div className="space-y-4 pt-4 border-t border-cream-300 dark:border-forest-800">
            <div className="flex items-center gap-4">
              <span className="label-caps">Quantity</span>
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
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
