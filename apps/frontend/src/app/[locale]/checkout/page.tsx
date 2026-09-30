'use client';

/**
 * Checkout Page
 *
 * Order review + shipping address + payment method selection.
 * Fully translated with next-intl.
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, CreditCard, Smartphone, AlertCircle, Truck } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { api, extractErrorMessage } from '@/lib/api';
import { formatKES, cn } from '@/lib/utils';

// ============================================
// VALIDATION
// ============================================
const checkoutSchema = z.object({
  shippingAddress: z.string().min(10, 'Shipping address must be at least 10 characters'),
});

type CheckoutInput = z.infer<typeof checkoutSchema>;
type PaymentMethod = 'STRIPE' | 'MPESA';

export default function CheckoutPage() {
  const router = useRouter();
  const t = useTranslations('checkout');
  const tCart = useTranslations('cart');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cart = useCartStore((s) => s.cart);
  const clearCart = useCartStore((s) => s.clearCart);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('STRIPE');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { shippingAddress: '' },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?next=/checkout');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (cart && cart.items.length === 0) {
      router.push('/cart');
    }
  }, [cart, router]);

  if (!cart || cart.items.length === 0) {
    return null;
  }

  async function onSubmit(data: CheckoutInput) {
    setSubmitting(true);
    setCheckoutError(null);

    try {
      const response = await api.post('/orders', {
        shippingAddress: data.shippingAddress,
        paymentMethod,
      });

      const order = response.data;
      await clearCart();

      if (paymentMethod === 'STRIPE') {
        router.push(`/checkout/stripe?orderId=${order.id}`);
      } else {
        router.push(`/checkout/mpesa?orderId=${order.id}`);
      }
    } catch (err) {
      setCheckoutError(extractErrorMessage(err));
      toast.error(t('failedToCreateOrder'));
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page py-8 md:py-12">
      <div className="mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-sm text-ink-600 dark:text-mint-300 hover:text-forest-700 dark:hover:text-emerald-400 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToCart')}
        </Link>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-ink-900 dark:text-mint-100">
          {t('title')}
        </h1>
      </div>

      {checkoutError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            {/* Shipping */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="h-5 w-5 text-forest-700 dark:text-emerald-500" />
                <h2 className="font-serif text-xl font-semibold text-ink-900 dark:text-mint-100">
                  {t('shippingAddress')}
                </h2>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="shippingAddress"
                  className="block text-sm font-medium text-forest-800 dark:text-mint-200"
                >
                  {t('shippingAddressLabel')}
                </label>
                <textarea
                  id="shippingAddress"
                  {...register('shippingAddress')}
                  rows={4}
                  placeholder={t('shippingAddressPlaceholder')}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm',
                    'bg-white dark:bg-forest-900/60',
                    'border-cream-400 dark:border-forest-700',
                    'placeholder:text-ink-400 dark:placeholder:text-mint-300/60',
                    'text-ink-900 dark:text-mint-100',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500',
                    errors.shippingAddress && 'border-red-500 focus-visible:ring-red-500'
                  )}
                  aria-invalid={errors.shippingAddress ? 'true' : undefined}
                />
                {errors.shippingAddress && (
                  <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                    {errors.shippingAddress.message}
                  </p>
                )}
                <p className="text-xs text-ink-500 dark:text-mint-300/70">
                  {t('shippingAddressHint')}
                </p>
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <CreditCard className="h-5 w-5 text-forest-700 dark:text-emerald-500" />
                <h2 className="font-serif text-xl font-semibold text-ink-900 dark:text-mint-100">
                  {t('paymentMethod')}
                </h2>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('STRIPE')}
                  className={cn(
                    'w-full text-left rounded-lg border-2 p-4 transition-all',
                    paymentMethod === 'STRIPE'
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-cream-300 dark:border-forest-800 hover:border-forest-500'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-forest-700 dark:text-emerald-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-900 dark:text-mint-100">
                          {t('cardPayment')}
                        </span>
                        <Badge variant="default">Stripe</Badge>
                      </div>
                      <p className="text-xs text-ink-600 dark:text-mint-300 mt-0.5">
                        {t('cardPaymentDescription')}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('MPESA')}
                  className={cn(
                    'w-full text-left rounded-lg border-2 p-4 transition-all',
                    paymentMethod === 'MPESA'
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-cream-300 dark:border-forest-800 hover:border-forest-500'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-6 w-6 text-forest-700 dark:text-emerald-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-900 dark:text-mint-100">
                          {t('mpesaPayment')}
                        </span>
                        <Badge variant="success">{t('fastBadge')}</Badge>
                      </div>
                      <p className="text-xs text-ink-600 dark:text-mint-300 mt-0.5">
                        {t('mpesaPaymentDescription')}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </Card>
          </div>

          {/* Order Review Sidebar */}
          <div className="lg:sticky lg:top-24 h-fit space-y-4">
            <Card className="p-6">
              <h2 className="font-serif text-xl font-semibold text-ink-900 dark:text-mint-100 mb-5">
                {t('orderReview')}
              </h2>

              <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-3 text-sm py-2 border-b border-cream-200 dark:border-forest-800 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink-900 dark:text-mint-100 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-ink-500 dark:text-mint-300/70">
                        {item.quantity} × {formatKES(item.product.price)}
                      </p>
                    </div>
                    <span className="font-medium text-ink-900 dark:text-mint-100 whitespace-nowrap">
                      {formatKES(Number(item.product.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-3 border-t border-cream-300 dark:border-forest-800 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-600 dark:text-mint-300">{tCart('subtotal')}</span>
                  <span className="font-medium">{formatKES(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-ink-600 dark:text-mint-300">
                    <Truck className="h-3.5 w-3.5" />
                    {tCart('shipping')}
                  </span>
                  <span className="font-medium">{formatKES(250)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-cream-300 dark:border-forest-800">
                  <span className="font-serif text-lg font-semibold">{tCart('total')}</span>
                  <span className="font-serif text-lg font-semibold text-forest-800 dark:text-emerald-400">
                    {formatKES(cart.subtotal + 250)}
                  </span>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full mt-6" isLoading={submitting}>
                {t('continueToPayment')}
              </Button>
            </Card>

            <p className="text-xs text-ink-500 dark:text-mint-300/70 text-center">
              {t('orderCreatedNote')}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
