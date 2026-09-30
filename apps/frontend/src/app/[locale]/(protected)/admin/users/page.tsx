'use client';

/**
 * Admin Users Page
 *
 * List users, view roles, and change roles with translations.
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, AlertCircle, Users, CheckCircle2, XCircle } from 'lucide-react';
import { Input, Select, Card, Badge, Skeleton } from '@/components/ui';
import { api, extractErrorMessage } from '@/lib/api';
import { formatDate, truncate, getInitials } from '@/lib/utils';

type UserRole = 'ADMIN' | 'SELLER' | 'USER';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ROLE_VARIANTS: Record<
  UserRole,
  'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  ADMIN: 'danger',
  SELLER: 'info',
  USER: 'neutral',
};

const ALL_ROLES: UserRole[] = ['ADMIN', 'SELLER', 'USER'];

export default function AdminUsersPage() {
  const t = useTranslations('admin.users');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      params.append('limit', '100');

      const res = await api.get<UsersResponse>(`/users?${params.toString()}`);
      setUsers(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function updateRole(userId: string, newRole: UserRole) {
    setUpdatingId(userId);
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      await loadUsers();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="label-caps mb-2 block">{t('eyebrow')}</span>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100 mb-2">
          {t('title')}
        </h1>
        <p className="text-sm text-ink-600 dark:text-mint-300">
          {t('countSuffix', { count: total })}
        </p>
      </div>

      <Card className="p-4">
        <div className="grid sm:grid-cols-[1fr_200px] gap-3">
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">{t('allRoles')}</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/30">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 dark:bg-forest-900/60">
              <Users className="h-8 w-8 text-forest-600 dark:text-emerald-500" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100 mb-2">
              {t('empty')}
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 dark:bg-forest-900/40">
                <tr className="border-b border-cream-200 dark:border-forest-800">
                  <th className="text-left px-4 py-3 label-caps text-[10px] font-semibold">
                    {t('columns.user')}
                  </th>
                  <th className="text-left px-4 py-3 label-caps text-[10px] font-semibold">
                    {t('columns.joined')}
                  </th>
                  <th className="text-left px-4 py-3 label-caps text-[10px] font-semibold">
                    {t('columns.verified')}
                  </th>
                  <th className="text-left px-4 py-3 label-caps text-[10px] font-semibold">
                    {t('columns.role')}
                  </th>
                  <th className="text-right px-4 py-3 label-caps text-[10px] font-semibold">
                    {t('columns.changeRole')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-cream-200 dark:border-forest-800 last:border-0 hover:bg-cream-50 dark:hover:bg-forest-900/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-800 dark:bg-emerald-600 text-cream-200 dark:text-white font-serif text-xs font-semibold flex-shrink-0">
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-ink-900 dark:text-mint-100">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-ink-500 dark:text-mint-300/70">
                            {truncate(user.email, 30)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-600 dark:text-mint-300/70">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {user.isEmailVerified ? (
                        <Badge variant="success">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {t('verified')}
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <XCircle className="h-3 w-3 mr-1" />
                          {t('pending')}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_VARIANTS[user.role]}>{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <select
                          aria-label={`Change role for ${user.email}`}
                          value={user.role}
                          disabled={updatingId === user.id}
                          onChange={(e) => updateRole(user.id, e.target.value as UserRole)}
                          className="text-xs rounded-lg border border-cream-400 dark:border-forest-700 bg-white dark:bg-forest-900/60 px-2 py-1.5 text-ink-900 dark:text-mint-100 cursor-pointer disabled:opacity-50"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
