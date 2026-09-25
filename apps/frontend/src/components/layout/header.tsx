'use client';

/**
 * Header
 *
 * Solid forest green header with cream text.
 * Matches the artisanal reference design.
 */

import Link from 'next/link';
import { ShoppingCart, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { ThemeToggle } from './theme-toggle';
import { Button } from '@/components/ui';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.cart?.itemCount ?? 0);

  return (
    <header className="sticky top-0 z-40 w-full bg-forest-800 dark:bg-forest-900 shadow-soft">
      <div className="container-page flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-semibold text-cream-200">E</span>
          <span className="font-serif text-lg font-medium text-cream-200 tracking-wide">
            E-Commerce
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/products"
            className="font-serif text-cream-200 hover:text-emerald-400 transition-colors"
          >
            Products
          </Link>
          <Link
            href="/categories"
            className="font-serif text-cream-200 hover:text-emerald-400 transition-colors"
          >
            Categories
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Cart */}
          <Link href="/cart" aria-label="Cart" className="relative">
            <button className="p-2 text-cream-200 hover:text-emerald-400 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>
          </Link>

          {/* Auth */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-cream-200 hover:text-emerald-400 transition-colors">
                  <UserIcon className="h-4 w-4" />
                  {user?.firstName ?? 'Account'}
                </button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => logout()}
                className="border-cream-200 text-cream-200 hover:bg-cream-200/10"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline font-serif text-cream-200 hover:text-emerald-400 transition-colors px-3"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-cream-200 px-4 py-2 font-serif text-forest-800 hover:bg-cream-100 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
