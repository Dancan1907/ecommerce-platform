'use client';

/**
 * User Dashboard Layout
 *
 * Two-column layout with sidebar navigation + content area.
 * Wrapped in ProtectedRoute so only authenticated users can access.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User as UserIcon, Lock, MapPin, ShoppingBag } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth';
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

  return (
    <ProtectedRoute>
      <div className="container-page py-8 md:py-12">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit">
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
          </aside>

          {/* Content */}
          <div>{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
