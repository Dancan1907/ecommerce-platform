'use client';

/**
 * Order Confirmation Page
 *
 * Shown after successful payment with translations.
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { CheckCircle2, Package, Truck, Home, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import { formatKES, formatDate } from '@/lib/utils';

interface OrderItem {
  id: string;
  productName: string;
  productSku: string;
  price: string;
  quantity: number;
  subtotal: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  tax: string;
  shippingCost: string;
  total: string;
  shippingAddress: string;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;
  const t = useTranslations('orders');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get<Order>(`/orders/${orderId}`)
      .then((res) => {
        if (!cancelled) setOrder(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // LOADING
  if (loading) {
    return (
      <div className="container-page py-20 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-forest-700 dark:text-emerald-500 mb-4" />
        <p className="text-sm text-ink-600 dark:text-mint-300">Loading…</p>
      </div>
    );
  }

  // ERROR
  if (error || !order) {
    return (
      <div className="container-page py-20 text-center max-w-md mx-auto">
        <AlertCircle className="mx-auto h-16 w-16 text-red-600 mb-4" />
        <h1 className="font-serif text-2xl font-semibold mb-3">{t('notFound')}</h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-8">
          {error ?? t('notFoundDescription')}
        </p>
        <Link href="/orders">
          <Button>{t('backToOrders')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12 max-w-3xl mx-auto">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
        </div>
        <span className="label-caps mb-2 block">{t('confirmEyebrow')}</span>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          {t('confirmTitle')}
        </h1>
        <p className="text-ink-600 dark:text-mint-300 max-w-lg mx-auto">{t('confirmMessage')}</p>
      </div>

      {/* Order number */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="label-caps mb-1 block">{t('orderNumber')}</span>
            <div className="font-serif text-2xl font-semibold text-ink-900 dark:text-mint-100">
              {order.orderNumber}
            </div>
            <p className="text-xs text-ink-500 dark:text-mint-300/70 mt-1">
              {t('placedOn', { date: formatDate(order.createdAt) })}
            </p>
          </div>
          <Badge variant={order.status === 'PAID' ? 'success' : 'warning'}>
            {t(`status.${order.status}` as never)}
          </Badge>
        </div>
      </Card>

      {/* Items */}
      <Card className="p-6 mb-6">
        <h2 className="font-serif text-xl font-semibold text-ink-900 dark:text-mint-100 mb-5 flex items-center gap-2">
          <Package className="h-5 w-5 text-forest-700 dark:text-emerald-500" />
          {t('items')}
        </h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between gap-4 py-3 border-b border-cream-200 dark:border-forest-800 last:border-0"
            >
              <div>
                <p className="font-medium text-ink-900 dark:text-mint-100">{item.productName}</p>
                <p className="text-xs text-ink-500 dark:text-mint-300/70">
                  {t('skus', { sku: item.productSku })}
                </p>
                <p className="text-sm text-ink-600 dark:text-mint-300 mt-1">
                  {t('itemQuantity', {
                    quantity: item.quantity,
                    price: formatKES(item.price),
                  })}
                </p>
              </div>
              <span className="font-medium text-ink-900 dark:text-mint-100 whitespace-nowrap">
                {formatKES(item.subtotal)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Shipping */}
      <Card className="p-6 mb-6">
        <h2 className="font-serif text-xl font-semibold text-ink-900 dark:text-mint-100 mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5 text-forest-700 dark:text-emerald-500" />
          {t('shippingTo')}
        </h2>
        <p className="text-sm text-ink-700 dark:text-mint-300 whitespace-pre-line leading-relaxed">
          {order.shippingAddress}
        </p>
      </Card>

      {/* Totals */}
      <Card className="p-6 mb-8">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-600 dark:text-mint-300">{t('subtotal')}</span>
            <span className="text-ink-900 dark:text-mint-100">{formatKES(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-600 dark:text-mint-300">{t('shipping')}</span>
            <span className="text-ink-900 dark:text-mint-100">{formatKES(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-cream-300 dark:border-forest-800">
            <span className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100">
              {t('total')}
            </span>
            <span className="font-serif text-lg font-semibold text-forest-800 dark:text-emerald-400">
              {formatKES(order.total)}
            </span>
          </div>
        </div>
      </Card>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href={`/orders/${order.id}`}>
          <Button leftIcon={<FileText className="h-4 w-4" />}>{t('viewOrderDetails')}</Button>
        </Link>
        <Link href="/products">
          <Button variant="secondary" leftIcon={<Home className="h-4 w-4" />}>
            {t('continueShopping')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
