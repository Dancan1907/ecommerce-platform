'use client';

/**
 * User Dashboard Layout
 *
 * Two-column layout with translated sidebar.
 */

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import {
  LayoutDashboard,
  User as UserIcon,
  Lock,
  MapPin,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const t = useTranslations('dashboard');

  const NAV_ITEMS = [
    { href: '/dashboard', label: t('overview'), icon: LayoutDashboard },
    { href: '/dashboard/profile', label: t('profile'), icon: UserIcon },
    { href: '/dashboard/password', label: t('password'), icon: Lock },
    { href: '/dashboard/addresses', label: t('addresses'), icon: MapPin },
    { href: '/orders', label: t('myOrders'), icon: ShoppingBag },
  ];

  return (
    <ProtectedRoute>
      <div className="container-page py-8 md:py-12">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          <aside className="lg:sticky lg:top-24 h-fit space-y-6">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-forest-800 text-cream-200 dark:bg-emerald-600 dark:text-white'
                        : 'text-ink-700 dark:text-mint-300 hover:bg-cream-200 dark:hover:bg-forest-900'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {isAdmin && (
              <div className="pt-6 border-t border-cream-300 dark:border-forest-800">
                <span className="label-caps text-[10px] mb-3 block text-forest-700 dark:text-emerald-500">
                  {t('administration')}
                </span>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {t('adminDashboard')}
                </Link>
              </div>
            )}
          </aside>

          <div>{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
