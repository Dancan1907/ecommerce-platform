'use client';

/**
 * Forgot Password Page
 *
 * User enters email → backend sends reset link.
 * Fully translated with next-intl.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation/auth-schemas';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSent(true);
      toast.success(t('sentToast'));
    } catch (err) {
      // Still show success to avoid leaking account existence
      setSent(true);
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================
  // SUCCESS STATE
  // ============================================
  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          {t('successTitle')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-8 leading-relaxed">
          {t('successMessage')}
        </p>
        <Link href="/login">
          <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            {t('backToSignIn')}
          </Button>
        </Link>
      </div>
    );
  }

  // ============================================
  // FORM STATE
  // ============================================
  return (
    <div>
      <div className="mb-8">
        <span className="label-caps mb-2 block">{t('eyebrow')}</span>
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          {t('title')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label={t('email')}
          type="email"
          placeholder={t('emailPlaceholder')}
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          autoComplete="email"
          autoFocus
          {...register('email')}
        />

        <Button type="submit" size="lg" className="w-full" isLoading={submitting}>
          {t('sendLink')}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-forest-700 dark:text-emerald-500 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('backToSignIn')}
        </Link>
      </div>
    </div>
  );
}
