'use client';

/**
 * User Dashboard Layout
 *
 * Two-column layout with sidebar navigation + content area.
 * Wrapped in ProtectedRoute so only authenticated users can access.
 * Admins see an additional link to the Admin Dashboard.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'Profile', icon: UserIcon },
  { href: '/dashboard/password', label: 'Change Password', icon: Lock },
  { href: '/dashboard/addresses', label: 'Addresses', icon: MapPin },
  { href: '/orders', label: 'My Orders', icon: ShoppingBag },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <ProtectedRoute>
      <div className="container-page py-8 md:py-12">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit space-y-6">
            {/* Main nav */}
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

            {/* Admin section (admin only) */}
            {isAdmin && (
              <div className="pt-6 border-t border-cream-300 dark:border-forest-800">
                <span className="label-caps text-[10px] mb-3 block text-forest-700 dark:text-emerald-500">
                  Administration
                </span>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              </div>
            )}
          </aside>

          {/* Content */}
          <div>{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
