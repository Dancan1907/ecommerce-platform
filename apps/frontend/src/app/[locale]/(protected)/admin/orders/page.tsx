'use client';

/**
 * Admin Orders Page
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, AlertCircle, ShoppingBag, Eye } from 'lucide-react';
import { Input, Select, Card, Badge, Skeleton } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import { formatKES, formatDate, truncate } from '@/lib/utils';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
}

interface OrderUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
  paidAt: string | null;
  user: OrderUser;
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

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const ALL_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');

      const res = await api.get<OrdersResponse>(`/orders/admin/all?${params.toString()}`);
      setOrders(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      await loadOrders();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="label-caps mb-2 block">Sales</span>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          Orders
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">
          {total} {total === 1 ? 'order' : 'orders'} total
        </p>
      </div>

      <Card className="p-4">
        <div className="grid sm:grid-cols-[1fr_200px] gap-3">
          <Input
            type="text"
            placeholder="Search by order number…"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
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
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 dark:bg-forest-900/60">
              <ShoppingBag className="h-8 w-8 text-forest-600 dark:text-emerald-500" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100 mb-2">
              {search || statusFilter ? 'No orders match your filters' : 'No orders yet'}
            </h3>
            <p className="text-sm text-ink-600 dark:text-mint-300">
              {search || statusFilter
                ? 'Try different search terms or clear the filter.'
                : 'Orders will appear here once customers start buying.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 dark:bg-forest-900/40">
                <tr className="border-b border-cream-200 dark:border-forest-800">
                  <th className="text-left px-4 py-3 label-caps text-[10px] font-semibold">
                    Order
                  </th>
                  <th className="text-left px-4 py-3 label-caps text-[10px] font-semibold">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 label-caps text-[10px] font-semibold">Date</th>
                  <th className="text-right px-4 py-3 label-caps text-[10px] font-semibold">
                    Total
                  </th>
                  <th className="text-left px-4 py-3 label-caps text-[10px] font-semibold">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 label-caps text-[10px] font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const nextStatuses = VALID_TRANSITIONS[order.status] ?? [];

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-cream-200 dark:border-forest-800 last:border-0 hover:bg-cream-50 dark:hover:bg-forest-900/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-ink-900 dark:text-mint-100">
                          {order.orderNumber}
                        </span>
                        <p className="text-xs text-ink-500 dark:text-mint-300/70 mt-0.5">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink-900 dark:text-mint-100 font-medium">
                          {order.user.firstName} {order.user.lastName}
                        </p>
                        <p className="text-xs text-ink-500 dark:text-mint-300/70">
                          {truncate(order.user.email, 25)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-600 dark:text-mint-300/70">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-ink-900 dark:text-mint-100">
                        {formatKES(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANTS[order.status] ?? 'neutral'}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {nextStatuses.length > 0 && (
                            <select
                              aria-label={`Change status for ${order.orderNumber}`}
                              value=""
                              disabled={updatingId === order.id}
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateStatus(order.id, e.target.value);
                                }
                              }}
                              className="text-xs rounded-lg border border-cream-400 dark:border-forest-700 bg-white dark:bg-forest-900/60 px-2 py-1.5 text-ink-900 dark:text-mint-100 cursor-pointer disabled:opacity-50"
                            >
                              <option value="">
                                {updatingId === order.id ? 'Updating…' : 'Change status'}
                              </option>
                              {nextStatuses.map((s) => (
                                <option key={s} value={s}>
                                  → {s}
                                </option>
                              ))}
                            </select>
                          )}
                          <Link
                            href={`/admin/orders/${order.id}`}
                            aria-label={`View ${order.orderNumber}`}
                            className="p-2 rounded-lg text-ink-600 dark:text-mint-300 hover:bg-forest-100 dark:hover:bg-forest-800 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
