'use client';

/**
 * Admin Overview Page
 *
 * Dashboard with key metrics + recent activity.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Package,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { Card, Badge, Skeleton } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import { formatKES, formatDate } from '@/lib/utils';

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  lowStockProducts: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

interface TopProduct {
  sku: string;
  quantitySold: number;
  product: { sku: string; name: string; slug: string; price: string } | null;
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

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.get<Stats>('/admin/stats'),
      api.get<RecentOrder[]>('/admin/orders/recent?limit=5'),
      api.get<TopProduct[]>('/admin/products/top?limit=5'),
    ])
      .then(([statsRes, ordersRes, productsRes]) => {
        if (cancelled) return;
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data);
        setTopProducts(productsRes.data);
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

  // ============================================
  // LOADING
  // ============================================
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/30">
        <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* ============================================
          STATS GRID
          ============================================ */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatKES(stats.totalRevenue)}
          accent
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={stats.totalOrders.toString()}
          subtext={`${stats.pendingOrders} pending`}
        />
        <StatCard icon={Users} label="Users" value={stats.totalUsers.toString()} />
        <StatCard
          icon={Package}
          label="Products"
          value={stats.totalProducts.toString()}
          subtext={stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low stock` : undefined}
        />
      </div>

      {/* ============================================
          LOW STOCK ALERT
          ============================================ */}
      {stats.lowStockProducts > 0 && (
        <Card className="p-5 border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-900 dark:text-amber-300">
                {stats.lowStockProducts}{' '}
                {stats.lowStockProducts === 1 ? 'product is' : 'products are'} running low on stock
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300/80 mt-1">
                Review and restock to avoid running out.
              </p>
            </div>
            <Link
              href="/admin/products"
              className="text-sm font-medium text-amber-800 dark:text-amber-300 hover:underline whitespace-nowrap"
            >
              View products →
            </Link>
          </div>
        </Card>
      )}

      {/* ============================================
          RECENT ORDERS
          ============================================ */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-semibold text-ink-900 dark:text-mint-100 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-forest-700 dark:text-emerald-500" />
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-forest-700 dark:text-emerald-500 hover:underline inline-flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-ink-600 dark:text-mint-300 text-center py-6">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 dark:border-forest-800">
                  <th className="text-left pb-3 label-caps text-[10px] font-semibold">Order</th>
                  <th className="text-left pb-3 label-caps text-[10px] font-semibold">Customer</th>
                  <th className="text-left pb-3 label-caps text-[10px] font-semibold">Date</th>
                  <th className="text-right pb-3 label-caps text-[10px] font-semibold">Total</th>
                  <th className="text-right pb-3 label-caps text-[10px] font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-cream-200 dark:border-forest-800 last:border-0"
                  >
                    <td className="py-3">
                      <Link
                        href={`/admin/orders?search=${order.orderNumber}`}
                        className="font-medium text-forest-700 dark:text-emerald-500 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 text-ink-700 dark:text-mint-300">
                      {order.user.firstName} {order.user.lastName}
                    </td>
                    <td className="py-3 text-ink-600 dark:text-mint-300/70 text-xs">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 text-right font-medium text-ink-900 dark:text-mint-100">
                      {formatKES(order.total)}
                    </td>
                    <td className="py-3 text-right">
                      <Badge variant={STATUS_VARIANTS[order.status] ?? 'neutral'}>
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ============================================
          TOP PRODUCTS
          ============================================ */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-semibold text-ink-900 dark:text-mint-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-forest-700 dark:text-emerald-500" />
            Top Selling Products
          </h2>
        </div>

        {topProducts.length === 0 ? (
          <p className="text-sm text-ink-600 dark:text-mint-300 text-center py-6">
            No sales data yet.
          </p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((item, idx) => (
              <div
                key={item.sku}
                className="flex items-center gap-4 py-2 border-b border-cream-200 dark:border-forest-800 last:border-0"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-100 dark:bg-forest-900/60 text-forest-800 dark:text-emerald-400 font-semibold text-sm flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink-900 dark:text-mint-100 truncate">
                    {item.product?.name ?? item.sku}
                  </p>
                  <p className="text-xs text-ink-500 dark:text-mint-300/70">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-ink-900 dark:text-mint-100">
                    {item.quantitySold} sold
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * Stat card for the top grid.
 */
function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  accent,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  subtext?: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`rounded-full p-2.5 ${
            accent ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-forest-50 dark:bg-forest-900/40'
          }`}
        >
          <Icon
            className={`h-4 w-4 ${
              accent
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-forest-700 dark:text-emerald-500'
            }`}
          />
        </div>
        <span className="label-caps text-[10px]">{label}</span>
      </div>
      <div className="font-serif text-2xl font-semibold text-ink-900 dark:text-mint-100">
        {value}
      </div>
      {subtext && <p className="text-xs text-ink-500 dark:text-mint-300/70 mt-1">{subtext}</p>}
    </Card>
  );
}
