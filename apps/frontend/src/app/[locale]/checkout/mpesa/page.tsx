'use client';

/**
 * M-Pesa Payment Page
 *
 * User enters phone → STK Push initiated → waiting → success/error.
 * Fully translated with next-intl.
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Smartphone, AlertCircle, CheckCircle2, Loader2, Phone } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';

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
  const t = useTranslations('checkout');

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

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  async function onSubmit(data: MpesaInput) {
    if (!orderId) {
      setError(t('missingOrder'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/payments/mpesa/stkpush', {
        orderId,
        phoneNumber: data.phoneNumber,
      });
      setStage('waiting');
      toast.success(t('mpesaPromptSent'));
      startPolling();
    } catch (err) {
      setError(extractErrorMessage(err));
      toast.error(t('failedToInitiateMpesa'));
    } finally {
      setSubmitting(false);
    }
  }

  function startPolling() {
    pollCountRef.current = 0;

    pollTimerRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      if (pollCountRef.current > 60) {
        stopPolling();
        setStage('error');
        setError(t('paymentTimedOut'));
        return;
      }

      try {
        const res = await api.get(`/payments/order/${orderId}`);
        if (res.data.status === 'PAID') {
          stopPolling();
          setStage('success');
          toast.success(t('paymentReceived'));
          setTimeout(() => {
            router.push(`/orders/${orderId}/confirmation`);
          }, 1500);
        }
      } catch {
        // ignore transient errors
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
        <h1 className="font-serif text-2xl font-semibold mb-3">{t('missingOrder')}</h1>
        <Link href="/checkout">
          <Button>{t('backToCheckout')}</Button>
        </Link>
      </div>
    );
  }

  // ============================================
  // WAITING
  // ============================================
  if (stage === 'waiting') {
    return (
      <div className="container-page py-20 text-center max-w-md mx-auto">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-forest-50 dark:bg-forest-900/40">
          <Smartphone className="h-10 w-10 text-forest-700 dark:text-emerald-500" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          {t('checkPhoneTitle')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-6 leading-relaxed">
          {t('checkPhoneMessage')}
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-ink-500 dark:text-mint-300/70 mb-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('waitingForConfirmation')}
        </div>
        <Link href="/orders">
          <Button variant="secondary" size="sm">
            {t('skipCheckLater')}
          </Button>
        </Link>
      </div>
    );
  }

  // ============================================
  // SUCCESS
  // ============================================
  if (stage === 'success') {
    return (
      <div className="container-page py-20 text-center max-w-md mx-auto">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          {t('paymentReceived')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">{t('redirectingToConfirmation')}</p>
      </div>
    );
  }

  // ============================================
  // FORM
  // ============================================
  return (
    <div className="container-page py-8 md:py-12 max-w-md mx-auto">
      <div className="mb-8">
        <Link
          href="/checkout"
          className="inline-flex items-center gap-1.5 text-sm text-ink-600 dark:text-mint-300 hover:text-forest-700 dark:hover:text-emerald-400 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToCheckout')}
        </Link>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          {t('mpesaTitle')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">{t('mpesaSubtitle')}</p>
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
            label={t('phoneNumber')}
            type="tel"
            placeholder={t('phoneNumberPlaceholder')}
            leftIcon={<Phone className="h-4 w-4" />}
            error={errors.phoneNumber?.message}
            autoComplete="tel"
            autoFocus
            {...register('phoneNumber')}
          />

          <p className="text-xs text-ink-500 dark:text-mint-300/70 leading-relaxed">
            {t('phoneNumberHint')}
          </p>

          <Button type="submit" size="lg" className="w-full" isLoading={submitting}>
            {t('sendPaymentRequest')}
          </Button>
        </form>
      </Card>
    </div>
  );
}

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
