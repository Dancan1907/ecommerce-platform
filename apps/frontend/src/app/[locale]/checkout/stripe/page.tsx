'use client';

/**
 * Stripe Payment Page
 *
 * Creates a payment intent for the order and displays the Stripe
 * client secret. Full Elements integration comes in a follow-up
 * — for now we show the intent info and a "Simulate payment" flow.
 */

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';

interface PaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

function StripePaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [intent, setIntent] = useState<PaymentIntentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // CREATE PAYMENT INTENT
  // ============================================
  useEffect(() => {
    if (!orderId) {
      setError('Missing order ID');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    api
      .post<PaymentIntentResponse>('/payments/create-intent', { orderId })
      .then((res) => {
        if (!cancelled) setIntent(res.data);
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
  // REDIRECT TO CONFIRMATION (after webhook fires)
  // For MVP: user clicks button to simulate success
  // ============================================
  function handleSimulateSuccess() {
    if (!orderId) return;
    toast.success('Payment successful!');
    router.push(`/orders/${orderId}/confirmation`);
  }

  // ============================================
  // LOADING
  // ============================================
  if (loading) {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-forest-50 dark:bg-forest-900/40">
          <Loader2 className="h-8 w-8 animate-spin text-forest-700 dark:text-emerald-500" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          Preparing your payment
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">Connecting to Stripe…</p>
      </div>
    );
  }

  // ============================================
  // ERROR
  // ============================================
  if (error || !intent) {
    return (
      <div className="container-page py-20 text-center max-w-md mx-auto">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          Payment setup failed
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-8">
          {error ?? 'Could not initialize payment'}
        </p>
        <Link href="/checkout">
          <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>Back to checkout</Button>
        </Link>
      </div>
    );
  }

  // ============================================
  // PAYMENT UI
  // ============================================
  const amountInUsd = (intent.amount / 100).toFixed(2);

  return (
    <div className="container-page py-8 md:py-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/checkout"
          className="inline-flex items-center gap-1.5 text-sm text-ink-600 dark:text-mint-300 hover:text-forest-700 dark:hover:text-emerald-400 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to checkout
        </Link>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          Card Payment
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">
          Complete your payment securely with Stripe.
        </p>
      </div>

      <Card className="p-6 md:p-8">
        {/* Amount */}
        <div className="text-center mb-8 pb-8 border-b border-cream-300 dark:border-forest-800">
          <span className="label-caps mb-2 block">Amount Due</span>
          <div className="font-serif text-4xl font-bold text-forest-800 dark:text-emerald-400">
            ${amountInUsd}
          </div>
          <p className="text-xs text-ink-500 dark:text-mint-300/70 mt-1">
            Charged in USD via Stripe (converted from KES)
          </p>
        </div>

        {/* Placeholder for Stripe Elements */}
        <div className="rounded-lg border-2 border-dashed border-cream-400 dark:border-forest-700 p-8 text-center mb-6">
          <CreditCard className="h-12 w-12 mx-auto mb-3 text-forest-600 dark:text-emerald-500" />
          <p className="text-sm font-medium text-ink-900 dark:text-mint-100 mb-1">
            Stripe Elements Integration
          </p>
          <p className="text-xs text-ink-500 dark:text-mint-300/70">Card form will render here</p>
        </div>

        {/* Test info */}
        <div className="rounded-lg bg-cream-100 dark:bg-forest-900/40 p-4 mb-6">
          <p className="text-xs text-ink-600 dark:text-mint-300 leading-relaxed">
            <strong className="text-ink-900 dark:text-mint-100">Test mode:</strong> Use card{' '}
            <code className="font-mono">4242 4242 4242 4242</code>, any future date, any CVC.
          </p>
          <p className="text-xs text-ink-500 dark:text-mint-300/70 mt-2">
            Payment Intent: <code className="font-mono">{intent.paymentIntentId}</code>
          </p>
        </div>

        {/* Simulate payment button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleSimulateSuccess}
          leftIcon={<CheckCircle2 className="h-5 w-5" />}
        >
          Simulate Payment Success
        </Button>

        <p className="text-xs text-ink-500 dark:text-mint-300/70 text-center mt-4">
          In production, completing the Stripe Elements form triggers the webhook and payment
          confirmation.
        </p>
      </Card>
    </div>
  );
}

// ============================================
// PAGE WRAPPER
// ============================================
export default function StripePaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-forest-700 dark:text-emerald-500" />
        </div>
      }
    >
      <StripePaymentContent />
    </Suspense>
  );
}
