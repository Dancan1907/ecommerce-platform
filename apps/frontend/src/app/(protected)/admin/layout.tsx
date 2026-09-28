'use client';

/**
 * Admin Dashboard Layout
 *
 * Separate layout for admin pages.
 * Protected by ADMIN role.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, FolderTree, ShoppingBag, Users, ArrowLeft } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-cream-100 dark:bg-forest-950">
        <div className="container-page py-8 md:py-12">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="label-caps mb-2 block">Admin</span>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100">
                Admin Dashboard
              </h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-ink-600 dark:text-mint-300 hover:text-forest-700 dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to store
            </Link>
          </div>

          {/* Layout */}
          <div className="grid lg:grid-cols-[220px_1fr] gap-8">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 h-fit">
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  // Match exact for /admin, startsWith for sub-routes
                  const isActive =
                    item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
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
      </div>
    </ProtectedRoute>
  );
}
