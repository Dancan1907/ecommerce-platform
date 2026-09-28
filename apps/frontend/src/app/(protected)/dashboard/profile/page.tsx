'use client';

/**
 * Profile Page
 *
 * View and update user profile information.
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { User, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Input, Card, Badge } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import { getInitials } from '@/lib/utils';

// ============================================
// VALIDATION
// ============================================
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
});

type ProfileInput = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
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

  // Reset form when user data loads
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
      // Update auth store with new user data
      useAuthStore.setState({ user: res.data });
      setSuccess(true);
      toast.success('Profile updated');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(extractErrorMessage(err));
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="label-caps mb-2 block">Account</span>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          Profile
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">Manage your personal information.</p>
      </div>

      {/* Avatar + Role */}
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
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Form */}
      <Card className="p-6">
        <h2 className="font-serif text-xl font-semibold text-ink-900 dark:text-mint-100 mb-5">
          Personal Information
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
            <span>Profile updated successfully.</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="First name"
              type="text"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.firstName?.message}
              autoComplete="given-name"
              {...register('firstName')}
            />
            <Input
              label="Last name"
              type="text"
              error={errors.lastName?.message}
              autoComplete="family-name"
              {...register('lastName')}
            />
          </div>

          <Input
            label="Email"
            type="email"
            leftIcon={<Mail className="h-4 w-4" />}
            value={user.email}
            disabled
            readOnly
            hint="Contact support to change your email"
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={submitting} disabled={!isDirty || submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
