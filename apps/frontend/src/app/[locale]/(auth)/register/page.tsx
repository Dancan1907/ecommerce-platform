'use client';

/**
 * Register Page
 *
 * Create account with auto-login and translations.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { registerSchema, type RegisterInput } from '@/lib/validation/auth-schemas';

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const login = useAuthStore((s) => s.login);
  const t = useTranslations('auth.register');
  const tCommon = useTranslations('auth.common');

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: RegisterInput) {
    setSubmitting(true);
    setRegisterError(null);

    const success = await registerUser({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    if (!success) {
      setSubmitting(false);
      setRegisterError(t('failureMessage'));
      toast.error(t('failureMessage'), { duration: 6000 });
      return;
    }

    const loginSuccess = await login(data.email, data.password);
    setSubmitting(false);

    if (loginSuccess) {
      toast.success(t('welcomeMessage'));
      router.push('/');
    } else {
      toast.success(t('welcomeMessage'));
      router.push('/login');
    }
  }

  return (
    <div>
      <div className="mb-8">
        <span className="label-caps mb-2 block">{t('eyebrow')}</span>
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          {t('title')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">{t('subtitle')}</p>
      </div>

      {registerError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{registerError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('firstName')}
            type="text"
            placeholder={t('firstNamePlaceholder')}
            leftIcon={<User className="h-4 w-4" />}
            error={errors.firstName?.message}
            autoComplete="given-name"
            {...register('firstName')}
          />
          <Input
            label={t('lastName')}
            type="text"
            placeholder={t('lastNamePlaceholder')}
            error={errors.lastName?.message}
            autoComplete="family-name"
            {...register('lastName')}
          />
        </div>

        <Input
          label={t('email')}
          type="email"
          placeholder={t('emailPlaceholder')}
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          autoComplete="email"
          {...register('email')}
        />

        <Input
          label={t('password')}
          type={showPassword ? 'text' : 'password'}
          placeholder={t('passwordPlaceholder')}
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? tCommon('hidePassword') : tCommon('showPassword')}
              className="pointer-events-auto text-forest-500 dark:text-mint-300 hover:text-forest-800 dark:hover:text-mint-100 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          error={errors.password?.message}
          autoComplete="new-password"
          {...register('password')}
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
              className="pointer-events-auto text-forest-500 dark:text-mint-300 hover:text-forest-800 dark:hover:text-mint-100 transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          {...register('confirmPassword')}
        />

        <Button type="submit" size="lg" className="w-full" isLoading={submitting}>
          {t('createAccount')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600 dark:text-mint-300">
        {t('haveAccount')}{' '}
        <Link
          href="/login"
          className="text-forest-800 dark:text-emerald-500 font-medium hover:underline"
        >
          {t('signIn')}
        </Link>
      </p>
    </div>
  );
}
