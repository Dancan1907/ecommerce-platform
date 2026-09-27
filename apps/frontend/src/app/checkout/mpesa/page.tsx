'use client';

/**
 * M-Pesa Payment Page
 *
 * User enters phone number → STK Push initiated → waiting state → success/error
 * Frontend polls payment status while waiting for M-Pesa callback.
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Smartphone, AlertCircle, CheckCircle2, Loader2, Phone } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';

// ============================================
// VALIDATION
// ============================================
const mpesaSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^254[17]\d{8}$/, 'Use format 254XXXXXXXXX (Safaricom or Airtel Kenya)'),
});

type MpesaInput = z.infer<typeof mpesaSchema>;

type Stage = 'form' | 'waiting' | 'success' | 'error';

function MpesaPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [stage, setStage] = useState<Stage>('form');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MpesaInput>({
    resolver: zodResolver(mpesaSchema),
    defaultValues: { phoneNumber: '' },
  });

  // ============================================
  // CLEANUP
  // ============================================
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // ============================================
  // SUBMIT — INITIATE STK PUSH
  // ============================================
  async function onSubmit(data: MpesaInput) {
    if (!orderId) {
      setError('Missing order ID');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/payments/mpesa/stkpush', {
        orderId,
        phoneNumber: data.phoneNumber,
      });

      // Move to waiting state + start polling
      setStage('waiting');
      toast.success('Check your phone for the M-Pesa prompt');
      startPolling();
    } catch (err) {
      setError(extractErrorMessage(err));
      toast.error('Failed to initiate M-Pesa payment');
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================
  // POLLING — CHECK IF PAYMENT COMPLETED
  // ============================================
  function startPolling() {
    pollCountRef.current = 0;

    pollTimerRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      // Give up after 60 polls (2 minutes at 2s intervals)
      if (pollCountRef.current > 60) {
        stopPolling();
        setStage('error');
        setError(
          'Payment timed out. If you entered your PIN, check your M-Pesa messages and order history.'
        );
        return;
      }

      try {
        const res = await api.get(`/payments/order/${orderId}`);
        // If order status is PAID, we're done
        if (res.data.status === 'PAID') {
          stopPolling();
          setStage('success');
          toast.success('Payment received!');
          setTimeout(() => {
            router.push(`/orders/${orderId}/confirmation`);
          }, 1500);
        }
      } catch {
        // Ignore transient errors during polling
      }
    }, 2000);
  }

  function stopPolling() {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

  // ============================================
  // NO ORDER ID
  // ============================================
  if (!orderId) {
    return (
      <div className="container-page py-20 text-center max-w-md mx-auto">
        <AlertCircle className="mx-auto h-16 w-16 text-red-600 mb-4" />
        <h1 className="font-serif text-2xl font-semibold mb-3">Missing order</h1>
        <Link href="/checkout">
          <Button>Back to checkout</Button>
        </Link>
      </div>
    );
  }

  // ============================================
  // WAITING STATE
  // ============================================
  if (stage === 'waiting') {
    return (
      <div className="container-page py-20 text-center max-w-md mx-auto">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-forest-50 dark:bg-forest-900/40">
          <Smartphone className="h-10 w-10 text-forest-700 dark:text-emerald-500" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          Check your phone
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-6 leading-relaxed">
          We&apos;ve sent an M-Pesa request to your phone. Open the prompt and enter your PIN to
          complete the payment.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-ink-500 dark:text-mint-300/70 mb-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          Waiting for confirmation…
        </div>
        <Link href="/orders">
          <Button variant="secondary" size="sm">
            Skip — check later
          </Button>
        </Link>
      </div>
    );
  }

  // ============================================
  // SUCCESS STATE
  // ============================================
  if (stage === 'success') {
    return (
      <div className="container-page py-20 text-center max-w-md mx-auto">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          Payment received!
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">
          Redirecting to your order confirmation…
        </p>
      </div>
    );
  }

  // ============================================
  // FORM STATE (or ERROR)
  // ============================================
  return (
    <div className="container-page py-8 md:py-12 max-w-md mx-auto">
      <div className="mb-8">
        <Link
          href="/checkout"
          className="inline-flex items-center gap-1.5 text-sm text-ink-600 dark:text-mint-300 hover:text-forest-700 dark:hover:text-emerald-400 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to checkout
        </Link>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          Pay with M-Pesa
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">
          Enter your M-Pesa phone number to receive a payment prompt.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="p-6 md:p-8">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <Smartphone className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="M-Pesa phone number"
            type="tel"
            placeholder="254712345678"
            leftIcon={<Phone className="h-4 w-4" />}
            error={errors.phoneNumber?.message}
            autoComplete="tel"
            autoFocus
            {...register('phoneNumber')}
          />

          <p className="text-xs text-ink-500 dark:text-mint-300/70 leading-relaxed">
            Enter the Safaricom or Airtel number registered to M-Pesa. You&apos;ll receive a prompt
            on this phone asking to confirm the payment.
          </p>

          <Button type="submit" size="lg" className="w-full" isLoading={submitting}>
            Send Payment Request
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ============================================
// PAGE WRAPPER
// ============================================
export default function MpesaPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-forest-700 dark:text-emerald-500" />
        </div>
      }
    >
      <MpesaPaymentContent />
    </Suspense>
  );
}
