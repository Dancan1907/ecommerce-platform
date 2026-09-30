'use client';

/**
 * Order Detail Page
 *
 * Full order view with progress timeline and translations.
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  CreditCard,
  Calendar,
  Loader2,
  AlertCircle,
  XCircle,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, Badge } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import { formatKES, formatDate, formatDateTime } from '@/lib/utils';

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
  paymentId: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_VARIANTS: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  PENDING: 'warning',
  PAID: 'success',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'neutral',
};

const TIMELINE_STEPS = [
  { key: 'placed', field: 'createdAt' },
  { key: 'paid', field: 'paidAt' },
  { key: 'shipped', field: 'shippedAt' },
  { key: 'delivered', field: 'deliveredAt' },
] as const;

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const t = useTranslations('orders');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

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

  async function handleCancel() {
    if (!order) return;
    if (!window.confirm(t('cancelConfirm'))) return;

    setCancelling(true);
    try {
      const res = await api.post(`/orders/${order.id}/cancel`);
      setOrder(res.data);
      toast.success(t('cancelSuccess'));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

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
          <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>{t('backToOrders')}</Button>
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const canCancel = order.status === 'PENDING' || order.status === 'PAID';

  return (
    <div className="container-page py-8 md:py-12 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-ink-600 dark:text-mint-300 hover:text-forest-700 dark:hover:text-emerald-400 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToOrders')}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <span className="label-caps mb-2 block">{t('orderNumber')}</span>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          {order.orderNumber}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 flex items-center gap-1.5 mb-3">
          <Calendar className="h-3.5 w-3.5" />
          {t('placedOn', { date: formatDate(order.createdAt) })}
        </p>
        <Badge variant={STATUS_VARIANTS[order.status] ?? 'neutral'}>
          {t(`status.${order.status}` as never)}
        </Badge>
      </div>

      {/* Items */}
      <Card className="p-6 mb-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100 mb-5 flex items-center gap-2">
          <Package className="h-5 w-5 text-forest-700 dark:text-emerald-500" />
          {t('items')} ({order.items.length})
        </h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between gap-4 py-3 border-b border-cream-200 dark:border-forest-800 last:border-0"
            >
              <div className="min-w-0">
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
        <h2 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-forest-700 dark:text-emerald-500" />
          {t('shippingAddress')}
        </h2>
        <p className="text-sm text-ink-700 dark:text-mint-300 whitespace-pre-line leading-relaxed">
          {order.shippingAddress}
        </p>
      </Card>

      {/* Payment */}
      <Card className="p-6 mb-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100 mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-forest-700 dark:text-emerald-500" />
          {t('payment')}
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-600 dark:text-mint-300">{t('method')}</span>
            <span className="text-ink-900 dark:text-mint-100 font-medium">
              {order.paymentMethod ?? '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-600 dark:text-mint-300">{t('subtotal')}</span>
            <span className="text-ink-900 dark:text-mint-100">{formatKES(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-600 dark:text-mint-300">{t('shipping')}</span>
            <span className="text-ink-900 dark:text-mint-100">{formatKES(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-cream-300 dark:border-forest-800">
            <span className="font-serif text-base font-semibold text-ink-900 dark:text-mint-100">
              {t('total')}
            </span>
            <span className="font-serif text-base font-semibold text-forest-800 dark:text-emerald-400">
              {formatKES(order.total)}
            </span>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-6 mb-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100 mb-4">
          {t('timeline')}
        </h2>
        <div className="space-y-3 text-sm text-ink-600 dark:text-mint-300">
          {TIMELINE_STEPS.map((step) => {
            const value = order[step.field as keyof Order] as string | null;
            const isComplete = value !== null;

            return (
              <div key={step.key} className="flex justify-between">
                <span className={isComplete ? 'text-ink-900 dark:text-mint-100' : ''}>
                  {t(step.key)}
                </span>
                <span>
                  {value
                    ? step.field === 'createdAt'
                      ? formatDate(value)
                      : formatDateTime(value)
                    : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Cancelled banner */}
      {isCancelled && (
        <Card className="p-5 mb-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">{t('cancelledBanner')}</p>
              <p className="text-sm text-red-700 dark:text-red-300/80 mt-1">
                {t('cancelledBannerDescription')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Cancel action */}
      {canCancel && (
        <Card className="p-6">
          <h2 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100 mb-3">
            {t('needToCancel')}
          </h2>
          <p className="text-xs text-ink-600 dark:text-mint-300 mb-4">{t('cancelExplanation')}</p>
          <Button
            variant="outline"
            className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900"
            onClick={handleCancel}
            isLoading={cancelling}
            leftIcon={!cancelling ? <XCircle className="h-4 w-4" /> : undefined}
          >
            {t('cancelOrder')}
          </Button>
        </Card>
      )}
    </div>
  );
}
