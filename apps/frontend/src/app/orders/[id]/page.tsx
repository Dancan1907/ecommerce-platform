'use client';

/**
 * Order Detail Page — DIAGNOSTIC VERSION
 *
 * Uses only native HTML elements to isolate an "Element type is invalid" error.
 * Once we find which component is broken, we restore them one by one.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  // LOADING
  // ============================================
  if (loading) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1rem', color: '#666' }}>Loading order…</p>
      </div>
    );
  }

  // ============================================
  // ERROR
  // ============================================
  if (error || !order) {
    return (
      <div
        style={{ padding: '4rem 1rem', textAlign: 'center', maxWidth: '32rem', margin: '0 auto' }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Order not found
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '2rem' }}>
          {error ?? 'We could not load this order.'}
        </p>
        <Link href="/orders" style={{ textDecoration: 'underline', color: '#059669' }}>
          ← Back to orders
        </Link>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER — NATIVE HTML ONLY
  // ============================================
  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Back link */}
      <Link
        href="/orders"
        style={{
          display: 'inline-block',
          fontSize: '0.875rem',
          color: '#666',
          marginBottom: '1.5rem',
          textDecoration: 'underline',
        }}
      >
        ← All orders
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#666',
          }}
        >
          Order
        </div>
        <h1
          style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', marginBottom: '0.5rem' }}
        >
          {order.orderNumber}
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>Placed {formatDate(order.createdAt)}</p>
        <p
          style={{
            display: 'inline-block',
            marginTop: '0.75rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            background: order.status === 'PAID' ? '#d1fae5' : '#fef3c7',
            color: order.status === 'PAID' ? '#065f46' : '#92400e',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {order.status}
        </p>
      </div>

      {/* Items */}
      <div
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          background: 'white',
        }}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
          Items ({order.items.length})
        </h2>
        {order.items.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.75rem 0',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <div>
              <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{item.productName}</p>
              <p style={{ fontSize: '0.75rem', color: '#888' }}>SKU: {item.productSku}</p>
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                {formatKES(item.price)} × {item.quantity}
              </p>
            </div>
            <span style={{ fontWeight: 500 }}>{formatKES(item.subtotal)}</span>
          </div>
        ))}
      </div>

      {/* Shipping */}
      <div
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          background: 'white',
        }}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Shipping Address
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#444', whiteSpace: 'pre-line' }}>
          {order.shippingAddress}
        </p>
      </div>

      {/* Payment */}
      <div
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          background: 'white',
        }}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Payment</h2>
        <div style={{ fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
            <span style={{ color: '#666' }}>Method</span>
            <span style={{ fontWeight: 500 }}>{order.paymentMethod ?? '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
            <span style={{ color: '#666' }}>Subtotal</span>
            <span>{formatKES(order.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
            <span style={{ color: '#666' }}>Shipping</span>
            <span>{formatKES(order.shippingCost)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '0.75rem',
              marginTop: '0.5rem',
              borderTop: '1px solid #e5e5e5',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            <span>Total</span>
            <span style={{ color: '#059669' }}>{formatKES(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          background: 'white',
          fontSize: '0.875rem',
        }}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Timeline</h2>
        <p style={{ color: '#666' }}>Created: {formatDate(order.createdAt)}</p>
        <p style={{ color: '#666' }}>Paid: {order.paidAt ? formatDateTime(order.paidAt) : '—'}</p>
        <p style={{ color: '#666' }}>
          Shipped: {order.shippedAt ? formatDateTime(order.shippedAt) : '—'}
        </p>
        <p style={{ color: '#666' }}>
          Delivered: {order.deliveredAt ? formatDateTime(order.deliveredAt) : '—'}
        </p>
      </div>
    </div>
  );
}
