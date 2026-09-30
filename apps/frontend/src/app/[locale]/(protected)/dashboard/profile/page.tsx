'use client';

/**
 * Profile Page
 *
 * View and update user profile with translations.
 */

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { User, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Input, Card, Badge } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import { getInitials } from '@/lib/utils';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
});

type ProfileInput = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const t = useTranslations('dashboard');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({ firstName: user.firstName, lastName: user.lastName });
    }
  }, [user, reset]);

  async function onSubmit(data: ProfileInput) {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await api.put<AuthUser>('/users/profile', data);
      useAuthStore.setState({ user: res.data });
      setSuccess(true);
      toast.success(t('profileUpdated'));
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(extractErrorMessage(err));
      toast.error(t('profileUpdateFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <span className="label-caps mb-2 block">{t('profileEyebrow')}</span>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          {t('profileTitle')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">{t('profileSubtitle')}</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-800 dark:bg-emerald-600 text-cream-200 dark:text-white font-serif text-xl font-semibold">
            {getInitials(user.firstName, user.lastName)}
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100">
              {user.firstName} {user.lastName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={user.role === 'ADMIN' ? 'danger' : 'neutral'}>{user.role}</Badge>
              {user.isEmailVerified && (
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t('verified')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-serif text-xl font-semibold text-ink-900 dark:text-mint-100 mb-5">
          {t('personalInfo')}
        </h2>

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
            <span>{t('profileUpdated')}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label={t('firstName')}
              type="text"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.firstName?.message}
              autoComplete="given-name"
              {...register('firstName')}
            />
            <Input
              label={t('lastName')}
              type="text"
              error={errors.lastName?.message}
              autoComplete="family-name"
              {...register('lastName')}
            />
          </div>

          <Input
            label={t('email')}
            type="email"
            leftIcon={<Mail className="h-4 w-4" />}
            value={user.email}
            disabled
            readOnly
            hint={t('emailHint')}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={submitting} disabled={!isDirty || submitting}>
              {t('saveChanges')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
