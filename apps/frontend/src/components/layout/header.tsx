'use client';

/**
 * Header
 *
 * Solid forest green header with cream text.
 * Navigation labels are translated via next-intl.
 * Includes a mobile drawer for small screens.
 */

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ShoppingCart, User as UserIcon, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { ThemeToggle } from './theme-toggle';
import { LocaleSwitcher } from './locale-switcher';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.cart?.itemCount ?? 0);
  const t = useTranslations('nav');
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-forest-800 dark:bg-forest-900 shadow-soft">
      <div className="container-page flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" onClick={closeMobile}>
          <span className="font-serif text-lg font-medium text-cream-200 tracking-wide">
            The Racing Shop
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/products"
            className="font-serif text-cream-200 hover:text-emerald-400 transition-colors"
          >
            {t('products')}
          </Link>
          <Link
            href="/categories"
            className="font-serif text-cream-200 hover:text-emerald-400 transition-colors"
          >
            {t('categories')}
          </Link>
          {isAuthenticated && (
            <Link
              href="/orders"
              className="font-serif text-cream-200 hover:text-emerald-400 transition-colors"
            >
              {t('orders')}
            </Link>
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <ThemeToggle />

          {/* Cart */}
          <Link href="/cart" aria-label={t('cart')} className="relative">
            <button className="p-2 text-cream-200 hover:text-emerald-400 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>
          </Link>

          {/* Auth (desktop + tablet) */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href={user?.role === 'ADMIN' ? '/admin' : '/dashboard'}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm text-cream-200 hover:text-emerald-400 transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                {user?.firstName ?? t('dashboard')}
              </Link>
              <button
                onClick={() => logout()}
                className="rounded-lg border border-cream-200/40 px-3 py-1.5 text-sm font-medium text-cream-200 hover:bg-cream-200/10 transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/login"
                className="hidden lg:inline font-serif text-cream-200 hover:text-emerald-400 transition-colors px-3"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-cream-200 px-4 py-2 font-serif text-forest-800 hover:bg-cream-100 transition-colors"
              >
                {t('register')}
              </Link>
            </div>
          )}

          {/* Hamburger (mobile only) */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="md:hidden p-2 text-cream-200 hover:text-emerald-400 transition-colors"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-cream-200/10 bg-forest-800 dark:bg-forest-900">
          <nav className="container-page flex flex-col py-4 gap-1">
            <Link
              href="/products"
              onClick={closeMobile}
              className="font-serif text-cream-200 hover:text-emerald-400 hover:bg-cream-200/5 transition-colors px-3 py-3 rounded-lg"
            >
              {t('products')}
            </Link>
            <Link
              href="/categories"
              onClick={closeMobile}
              className="font-serif text-cream-200 hover:text-emerald-400 hover:bg-cream-200/5 transition-colors px-3 py-3 rounded-lg"
            >
              {t('categories')}
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/orders"
                  onClick={closeMobile}
                  className="font-serif text-cream-200 hover:text-emerald-400 hover:bg-cream-200/5 transition-colors px-3 py-3 rounded-lg"
                >
                  {t('orders')}
                </Link>
                <Link
                  href={user?.role === 'ADMIN' ? '/admin' : '/dashboard'}
                  onClick={closeMobile}
                  className="font-serif text-cream-200 hover:text-emerald-400 hover:bg-cream-200/5 transition-colors px-3 py-3 rounded-lg"
                >
                  {user?.firstName ?? t('dashboard')}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    closeMobile();
                  }}
                  className="text-left rounded-lg border border-cream-200/40 px-3 py-3 font-medium text-cream-200 hover:bg-cream-200/10 transition-colors mt-2"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2 mt-2 border-t border-cream-200/10">
                <Link
                  href="/login"
                  onClick={closeMobile}
                  className="rounded-lg border border-cream-200/40 px-4 py-3 font-serif text-cream-200 hover:bg-cream-200/10 transition-colors text-center"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobile}
                  className="rounded-lg bg-cream-200 px-4 py-3 font-serif text-forest-800 hover:bg-cream-100 transition-colors text-center"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
