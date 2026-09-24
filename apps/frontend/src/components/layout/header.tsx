'use client';

/**
 * Header
 *
 * Global site header with:
 *  - Logo
 *  - Navigation links
 *  - Cart icon with item count badge
 *  - Theme toggle
 *  - Auth dropdown (Login/Register or user menu)
 *
 * Sticky at the top with glass-morphism backdrop blur.
 */

import Link from 'next/link';
import { ShoppingCart, User as UserIcon, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { ThemeToggle } from './theme-toggle';
import { Button } from '@/components/ui';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.cart?.itemCount ?? 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/30 backdrop-blur-glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="rounded-lg bg-indigo-600 px-2 py-1 text-white">E</span>
          <span className="hidden sm:inline">E-Commerce</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/products" className="hover:text-indigo-600 transition-colors">
            Products
          </Link>
          <Link href="/categories" className="hover:text-indigo-600 transition-colors">
            Categories
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Cart with badge */}
          <Link href="/cart" aria-label="Cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Auth area */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <UserIcon className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">{user?.firstName ?? 'Account'}</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden sm:inline">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
