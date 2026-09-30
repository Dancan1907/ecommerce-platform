'use client';

/**
 * Cart Page
 *
 * Lists cart items with translations.
 */

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button, Card, Skeleton } from '@/components/ui';
import { CartItemRow } from '@/components/cart/cart-item-row';
import { CartSummary } from '@/components/cart/cart-summary';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';

export default function CartPage() {
  const router = useRouter();
  const t = useTranslations('cart');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cart = useCartStore((s) => s.cart);
  const isLoading = useCartStore((s) => s.isLoading);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?next=/cart');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && !cart) {
      fetchCart();
    }
  }, [isAuthenticated, cart, fetchCart]);

  if (!cart && isLoading) {
    return <CartSkeleton />;
  }

  const isEmpty = !cart || cart.items.length === 0;

  if (isEmpty) {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cream-200 dark:bg-forest-900/60">
          <ShoppingBag className="h-10 w-10 text-forest-600 dark:text-emerald-500" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          {t('empty')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-8 max-w-md mx-auto">
          {t('emptyDescription')}
        </p>
        <Link href="/products">
          <Button size="lg">{t('startShopping')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-12">
      <div className="mb-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm text-ink-600 dark:text-mint-300 hover:text-forest-700 dark:hover:text-emerald-400 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('continueShopping')}
        </Link>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-ink-900 dark:text-mint-100">
          {t('title')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mt-2">
          {t('itemsInCart', { count: cart.itemCount })}
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <Card className="p-5 md:p-6">
          {cart.items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </Card>

        <div className="lg:sticky lg:top-24 h-fit">
          <CartSummary subtotal={cart.subtotal} itemCount={cart.itemCount} />
        </div>
      </div>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="container-page py-8 md:py-12">
      <Skeleton className="h-10 w-64 mb-4" />
      <Skeleton className="h-5 w-40 mb-8" />
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <Card className="p-6 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-5">
              <Skeleton className="h-24 w-24 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
          ))}
        </Card>
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
