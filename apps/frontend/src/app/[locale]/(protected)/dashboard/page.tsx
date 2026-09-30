'use client';

/**
 * User Dashboard Overview
 *
 * Shows quick stats + recent activity with translations.
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Package, ShoppingBag, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { Card, Badge, Skeleton } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import { formatKES, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
}

interface OrdersResponse {
  data: Order[];
  total: number;
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

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const t = useTranslations('dashboard');
  const tOrders = useTranslations('orders');

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get<OrdersResponse>('/orders?limit=5')
      .then((res) => {
        if (cancelled) return;
        setOrders(res.data.data);
        setTotalOrders(res.data.total);
        const spent = res.data.data
          .filter((o) => o.status === 'PAID' || o.status === 'DELIVERED')
          .reduce((sum, o) => sum + Number(o.total), 0);
        setTotalSpent(spent);
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
  }, []);

  const activeOrders = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'PAID' || o.status === 'SHIPPED'
  ).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid sm:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <span className="label-caps mb-2 block">{t('eyebrow')}</span>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          {t('welcomeBack', { name: user?.firstName ?? 'there' })}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">{t('quickLook')}</p>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/30">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </Card>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={ShoppingBag} label={t('totalOrders')} value={totalOrders.toString()} />
        <StatCard icon={Clock} label={t('activeOrders')} value={activeOrders.toString()} />
        <StatCard icon={CheckCircle2} label={t('totalSpent')} value={formatKES(totalSpent)} />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-semibold text-ink-900 dark:text-mint-100 flex items-center gap-2">
            <Package className="h-5 w-5 text-forest-700 dark:text-emerald-500" />
            {t('recentOrders')}
          </h2>
          <Link
            href="/orders"
            className="text-sm font-medium text-forest-700 dark:text-emerald-500 hover:underline inline-flex items-center gap-1"
          >
            {t('viewAll')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-ink-600 dark:text-mint-300 mb-4">{t('noOrders')}</p>
            <Link
              href="/products"
              className="text-sm font-medium text-forest-700 dark:text-emerald-500 hover:underline"
            >
              {t('startShopping')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between py-3 border-b border-cream-200 dark:border-forest-800 last:border-0 hover:opacity-80 transition-opacity"
              >
                <div>
                  <p className="font-medium text-ink-900 dark:text-mint-100">{order.orderNumber}</p>
                  <p className="text-xs text-ink-500 dark:text-mint-300/70">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-ink-900 dark:text-mint-100">
                    {formatKES(order.total)}
                  </span>
                  <Badge variant={STATUS_VARIANTS[order.status] ?? 'neutral'}>
                    {tOrders(`status.${order.status}` as never)}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-full bg-forest-50 dark:bg-emerald-950/40 p-2.5">
          <Icon className="h-4 w-4 text-forest-700 dark:text-emerald-500" />
        </div>
        <span className="label-caps text-[10px]">{label}</span>
      </div>
      <div className="font-serif text-2xl font-semibold text-ink-900 dark:text-mint-100">
        {value}
      </div>
    </Card>
  );
}
