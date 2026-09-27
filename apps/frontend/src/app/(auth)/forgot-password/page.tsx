'use client';

/**
 * Forgot Password Page
 *
 * User enters email → backend sends reset link (stubbed for now)
 * Shows success message regardless (don't leak whether email exists).
 */

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation/auth-schemas';

export default function ForgotPasswordPage() {
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
      toast.success('Check your email for reset instructions');
    } catch (err) {
      // Even on error, show generic message to avoid leaking account existence
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
          Check your email
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300 mb-8 leading-relaxed">
          If an account exists with that email, we&apos;ve sent instructions to reset your password.
          The link expires in 1 hour.
        </p>
        <Link href="/login">
          <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to sign in
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
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          Forgot password?
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">
          Enter your email and we&apos;ll send you instructions to reset it.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          autoComplete="email"
          autoFocus
          {...register('email')}
        />

        <Button type="submit" size="lg" className="w-full" isLoading={submitting}>
          Send reset link
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-forest-700 dark:text-emerald-500 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
