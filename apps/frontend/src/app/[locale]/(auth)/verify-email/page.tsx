'use client';

/**
 * Verify Email Page
 *
 * User arrives from email link: /verify-email?token=xxx
 * Fully translated with next-intl.
 */

import { Suspense, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';

type Status = 'loading' | 'success' | 'error' | 'missing-token';

// ============================================
// INNER COMPONENT (uses useSearchParams)
// ============================================
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const t = useTranslations('auth.verifyEmail');

  const [status, setStatus] = useState<Status>(token ? 'loading' : 'missing-token');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function verify() {
      try {
        await api.post('/auth/verify-email', { token });
        if (!cancelled) setStatus('success');
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(extractErrorMessage(err) || t('errorMessage'));
          setStatus('error');
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, t]);

  // ============================================
  // LOADING
  // ============================================
  if (status === 'loading') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-forest-50 dark:bg-forest-900/40">
          <Loader2 className="h-8 w-8 animate-spin text-forest-700 dark:text-emerald-500" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          {t('verifyingTitle')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">{t('verifyingMessage')}</p>
      </div>
    );
  }

  // ============================================
  // SUCCESS
  // ============================================
  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          {t('successTitle')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-8">{t('successMessage')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login">
            <Button>{t('signIn')}</Button>
          </Link>
          <Link href="/products">
            <Button variant="secondary">{t('browseProducts')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ============================================
  // MISSING TOKEN
  // ============================================
  if (status === 'missing-token') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
          <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          {t('missingTokenTitle')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-8 leading-relaxed">
          {t('missingTokenMessage')}
        </p>
        <Link href="/login">
          <Button>{t('backToSignIn')}</Button>
        </Link>
      </div>
    );
  }

  // ============================================
  // ERROR
  // ============================================
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
        {t('errorTitle')}
      </h1>
      <p className="text-sm text-ink-600 dark:text-mint-300 mb-8">
        {errorMessage || t('errorMessage')}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/login">
          <Button>{t('backToSignIn')}</Button>
        </Link>
        <Link href="/forgot-password">
          <Button variant="secondary">{t('getHelp')}</Button>
        </Link>
      </div>
    </div>
  );
}

// ============================================
// PAGE WRAPPER
// ============================================
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="py-8" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
