'use client';

/**
 * Register Page
 *
 * - React Hook Form + Zod validation (names, email, password, confirm)
 * - Password visibility toggles for both password fields
 * - Auto-login on success, redirect home
 * - Persistent error banner on failure
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

    // Step 1: Register
    const success = await registerUser({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    if (!success) {
      setSubmitting(false);
      setRegisterError('Registration failed. This email may already be in use.');
      toast.error('Registration failed', { duration: 6000 });
      return;
    }

    // Step 2: Auto-login
    const loginSuccess = await login(data.email, data.password);
    setSubmitting(false);

    if (loginSuccess) {
      toast.success('Welcome! Your account is ready.');
      router.push('/');
    } else {
      // Registration worked but login failed — rare, but handle it
      toast.success('Account created! Please sign in.');
      router.push('/login');
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          Create your account
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">
          Join us to shop curated local treasures.
        </p>
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
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            type="text"
            placeholder="Jane"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.firstName?.message}
            autoComplete="given-name"
            {...register('firstName')}
          />
          <Input
            label="Last name"
            type="text"
            placeholder="Doe"
            error={errors.lastName?.message}
            autoComplete="family-name"
            {...register('lastName')}
          />
        </div>

        {/* Email */}
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          autoComplete="email"
          {...register('email')}
        />

        {/* Password */}
        <Input
          label="Password"
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
          {...register('password')}
        />

        {/* Confirm password */}
        <Input
          label="Confirm password"
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
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600 dark:text-mint-300">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-forest-800 dark:text-emerald-500 font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
