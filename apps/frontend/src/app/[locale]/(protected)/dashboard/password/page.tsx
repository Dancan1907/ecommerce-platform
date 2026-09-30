'use client';

/**
 * Change Password Page
 *
 * Fully translated with next-intl.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

type PasswordInput = z.infer<typeof passwordSchema>;

export default function ChangePasswordPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('auth.common');

  const [submitting, setSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: PasswordInput) {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await api.put('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      reset();
      toast.success(t('passwordChanged'));
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(extractErrorMessage(err));
      toast.error(t('passwordChangeFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <span className="label-caps mb-2 block">{t('passwordEyebrow')}</span>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          {t('passwordTitle')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">{t('passwordSubtitle')}</p>
      </div>

      <Card className="p-6 md:p-8 max-w-xl">
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{t('passwordChanged')}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label={t('currentPassword')}
            type={showCurrent ? 'text' : 'password'}
            placeholder={t('currentPasswordPlaceholder')}
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowCurrent((s) => !s)}
                aria-label={showCurrent ? tCommon('hidePassword') : tCommon('showPassword')}
                className="pointer-events-auto text-forest-500 dark:text-mint-300 hover:text-forest-800 dark:hover:text-mint-100"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.currentPassword?.message}
            autoComplete="current-password"
            {...register('currentPassword')}
          />

          <Input
            label={t('newPassword')}
            type={showNew ? 'text' : 'password'}
            placeholder={t('newPasswordPlaceholder')}
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                aria-label={showNew ? tCommon('hidePassword') : tCommon('showPassword')}
                className="pointer-events-auto text-forest-500 dark:text-mint-300 hover:text-forest-800 dark:hover:text-mint-100"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.newPassword?.message}
            hint={t('newPasswordHint')}
            autoComplete="new-password"
            {...register('newPassword')}
          />

          <Input
            label={t('confirmPassword')}
            type={showConfirm ? 'text' : 'password'}
            placeholder={t('confirmPasswordPlaceholder')}
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? tCommon('hidePassword') : tCommon('showPassword')}
                className="pointer-events-auto text-forest-500 dark:text-mint-300 hover:text-forest-800 dark:hover:text-mint-100"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            {...register('confirmPassword')}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={submitting}>
              {t('updatePassword')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
