'use client';

/**
 * Reset Password Page
 *
 * User arrives here from an email link: /reset-password?token=xxx
 * Sets a new password using the token.
 */

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validation/auth-schemas';

// ============================================
// INNER COMPONENT (uses useSearchParams)
// ============================================
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(data: ResetPasswordInput) {
    if (!token) {
      setResetError('Missing reset token. Please use the link from your email.');
      return;
    }

    setSubmitting(true);
    setResetError(null);

    try {
      await api.post('/auth/reset-password', {
        token,
        password: data.password,
      });
      setDone(true);
      toast.success('Password reset! You can now sign in.');
      // Redirect to login after 2 seconds
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setResetError(extractErrorMessage(err));
      toast.error('Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================
  // MISSING TOKEN
  // ============================================
  if (!token) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          Invalid reset link
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-8">
          The password reset link is missing or invalid. Please request a new one.
        </p>
        <Link href="/forgot-password">
          <Button>Request new link</Button>
        </Link>
      </div>
    );
  }

  // ============================================
  // SUCCESS
  // ============================================
  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-3">
          Password reset!
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-8">
          Your password has been updated. Redirecting you to sign in…
        </p>
        <Link href="/login">
          <Button>Go to sign in</Button>
        </Link>
      </div>
    );
  }

  // ============================================
  // FORM
  // ============================================
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          Set a new password
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      {resetError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{resetError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="New password"
          type={showPassword ? 'text' : 'password'}
          placeholder="At least 8 characters"
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="pointer-events-auto text-forest-500 dark:text-mint-300 hover:text-forest-800 dark:hover:text-mint-100 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          error={errors.password?.message}
          autoComplete="new-password"
          autoFocus
          {...register('password')}
        />

        <Input
          label="Confirm new password"
          type={showConfirm ? 'text' : 'password'}
          placeholder="Re-enter your password"
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
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
          Reset password
        </Button>
      </form>
    </div>
  );
}

// ============================================
// PAGE WRAPPER (Suspense for useSearchParams)
// ============================================
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-forest-800 dark:border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
