'use client';

/**
 * Orders List Page
 *
 * Shows the current user's order history with translations.
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Package, ChevronRight } from 'lucide-react';
import { Button, Card, Badge, Skeleton } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import { formatKES, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
  paidAt: string | null;
  items: OrderItem[];
}

interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

export default function OrdersPage() {
  const router = useRouter();
  const t = useTranslations('orders');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?next=/orders');
      return;
    }

    let cancelled = false;
    setLoading(true);

    api
      .get<OrdersResponse>('/orders')
      .then((res) => {
        if (!cancelled) setOrders(res.data.data);
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
  }, [isAuthenticated, router]);

  // LOADING
  if (loading) {
    return (
      <div className="container-page py-8 md:py-12">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // EMPTY
  if (orders.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cream-200 dark:bg-forest-900/60">
          <Package className="h-10 w-10 text-forest-600 dark:text-emerald-500" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          {t('empty')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-8 max-w-md mx-auto">
          {t('emptyDescription')}
        </p>
        <Link href="/products">
          <Button size="lg">{t('browseProducts')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-12">
      <div className="mb-8">
        <span className="label-caps mb-2 block">{t('eyebrow')}</span>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          {t('title')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">
          {t('count', { count: orders.length })}
        </p>
      </div>

      {error && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50 dark:bg-red-950/40">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </Card>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <Link
              href={`/orders/${order.id}`}
              className="flex items-center justify-between p-5 hover:bg-cream-50 dark:hover:bg-forest-900/40 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100">
                    {order.orderNumber}
                  </span>
                  <Badge variant={STATUS_VARIANTS[order.status] ?? 'neutral'}>
                    {t(`status.${order.status}` as never)}
                  </Badge>
                </div>
                <p className="text-xs text-ink-500 dark:text-mint-300/70 mb-2">
                  {t('placedOn', { date: formatDate(order.createdAt) })}
                </p>
                <p className="text-sm text-ink-600 dark:text-mint-300 truncate">
                  {order.items.length > 2
                    ? t('itemPreviewMore', {
                        count: order.items.length,
                        names: order.items
                          .slice(0, 2)
                          .map((i) => i.productName)
                          .join(', '),
                        more: order.items.length - 2,
                      })
                    : t('itemPreview', {
                        count: order.items.length,
                        names: order.items.map((i) => i.productName).join(', '),
                      })}
                </p>
              </div>

              <div className="flex items-center gap-4 ml-4">
                <span className="font-serif text-lg font-semibold text-forest-800 dark:text-emerald-400 whitespace-nowrap hidden sm:block">
                  {formatKES(order.total)}
                </span>
                <ChevronRight className="h-5 w-5 text-ink-400 dark:text-mint-300/50 flex-shrink-0" />
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
