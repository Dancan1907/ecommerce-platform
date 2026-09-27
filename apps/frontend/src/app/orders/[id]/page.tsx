'use client';

/**
 * Order Detail Page
 *
 * Full order view with items, shipping, totals, and cancel action.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // ============================================
  // FETCH ORDER
  // ============================================
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

  // ============================================
  // CANCEL ORDER
  // ============================================
  async function handleCancel() {
    if (!order) return;
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setCancelling(true);
    try {
      const res = await api.post(`/orders/${order.id}/cancel`);
      setOrder(res.data);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

  // ============================================
  // LOADING
  // ============================================
  if (loading) {
    return (
      <div className="container-page py-20 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-forest-700 dark:text-emerald-500 mb-4" />
        <p className="text-sm text-ink-600 dark:text-mint-300">Loading order…</p>
      </div>
    );
  }

  // ============================================
  // ERROR
  // ============================================
  if (error || !order) {
    return (
      <div className="container-page py-20 text-center max-w-md mx-auto">
        <AlertCircle className="mx-auto h-16 w-16 text-red-600 mb-4" />
        <h1 className="font-serif text-2xl font-semibold mb-3">Order not found</h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-8">
          {error ?? "We couldn't load this order."}
        </p>
        <Link href="/orders">
          <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>Back to orders</Button>
        </Link>
      </div>
    );
  }

  const canCancel = order.status === 'PENDING' || order.status === 'PAID';

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="container-page py-8 md:py-12 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-ink-600 dark:text-mint-300 hover:text-forest-700 dark:hover:text-emerald-400 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All orders
      </Link>

      {/* Header */}
      <div className="mb-8">
        <span className="label-caps mb-2 block">Order</span>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          {order.orderNumber}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 flex items-center gap-1.5 mb-3">
          <Calendar className="h-3.5 w-3.5" />
          Placed {formatDate(order.createdAt)}
        </p>
        <Badge variant={STATUS_VARIANTS[order.status] ?? 'neutral'}>{order.status}</Badge>
      </div>

      {/* Items */}
      <Card className="p-6 mb-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100 mb-5 flex items-center gap-2">
          <Package className="h-5 w-5 text-forest-700 dark:text-emerald-500" />
          Items ({order.items.length})
        </h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between gap-4 py-3 border-b border-cream-200 dark:border-forest-800 last:border-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink-900 dark:text-mint-100">{item.productName}</p>
                <p className="text-xs text-ink-500 dark:text-mint-300/70">SKU: {item.productSku}</p>
                <p className="text-sm text-ink-600 dark:text-mint-300 mt-1">
                  {formatKES(item.price)} × {item.quantity}
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
          Shipping Address
        </h2>
        <p className="text-sm text-ink-700 dark:text-mint-300 whitespace-pre-line leading-relaxed">
          {order.shippingAddress}
        </p>
      </Card>

      {/* Payment */}
      <Card className="p-6 mb-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100 mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-forest-700 dark:text-emerald-500" />
          Payment
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-600 dark:text-mint-300">Method</span>
            <span className="text-ink-900 dark:text-mint-100 font-medium">
              {order.paymentMethod ?? '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-600 dark:text-mint-300">Subtotal</span>
            <span className="text-ink-900 dark:text-mint-100">{formatKES(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-600 dark:text-mint-300">Shipping</span>
            <span className="text-ink-900 dark:text-mint-100">{formatKES(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-cream-300 dark:border-forest-800">
            <span className="font-serif text-base font-semibold text-ink-900 dark:text-mint-100">
              Total
            </span>
            <span className="font-serif text-base font-semibold text-forest-800 dark:text-emerald-400">
              {formatKES(order.total)}
            </span>
          </div>
        </div>
      </Card>

      {/* Timestamps */}
      <Card className="p-6 mb-6">
        <h2 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100 mb-4">
          Timeline
        </h2>
        <div className="space-y-2 text-sm text-ink-600 dark:text-mint-300">
          <p>
            <strong className="text-ink-900 dark:text-mint-100">Placed:</strong>{' '}
            {formatDate(order.createdAt)}
          </p>
          <p>
            <strong className="text-ink-900 dark:text-mint-100">Paid:</strong>{' '}
            {order.paidAt ? formatDateTime(order.paidAt) : '—'}
          </p>
          <p>
            <strong className="text-ink-900 dark:text-mint-100">Shipped:</strong>{' '}
            {order.shippedAt ? formatDateTime(order.shippedAt) : '—'}
          </p>
          <p>
            <strong className="text-ink-900 dark:text-mint-100">Delivered:</strong>{' '}
            {order.deliveredAt ? formatDateTime(order.deliveredAt) : '—'}
          </p>
        </div>
      </Card>

      {/* Actions */}
      {canCancel && (
        <Card className="p-6">
          <h2 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100 mb-3">
            Need to cancel?
          </h2>
          <p className="text-xs text-ink-600 dark:text-mint-300 mb-4">
            You can cancel this order before it ships. Stock will be restored automatically.
          </p>
          <Button
            variant="outline"
            className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900"
            onClick={handleCancel}
            isLoading={cancelling}
            leftIcon={!cancelling ? <XCircle className="h-4 w-4" /> : undefined}
          >
            Cancel Order
          </Button>
        </Card>
      )}
    </div>
  );
}
