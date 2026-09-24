/**
 * Footer
 *
 * Site-wide footer with links and copyright.
 */

import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-glass">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-lg mb-3">
              <span className="rounded-lg bg-indigo-600 px-2 py-1 text-white">E</span>
              <span>E-Commerce</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Modern commerce for Kenya and beyond.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Shop</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/products" className="hover:text-indigo-600">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-indigo-600">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-indigo-600">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Account</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/dashboard" className="hover:text-indigo-600">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-600">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-indigo-600">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/terms" className="hover:text-indigo-600">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-indigo-600">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/20 dark:border-white/10 pt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          © {year} E-Commerce Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
