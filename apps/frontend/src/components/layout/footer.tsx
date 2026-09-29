/**
 * Footer
 *
 * Solid forest green footer with translated labels.
 */

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function Footer() {
  const year = new Date().getFullYear();
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');

  return (
    <footer className="mt-auto bg-forest-800 dark:bg-forest-900 border-t border-forest-700 dark:border-emerald-900/30 text-cream-200">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-serif text-2xl font-semibold">E</span>
              <span className="font-serif text-lg font-medium tracking-wide">E-Commerce</span>
            </div>
            <p className="text-sm text-cream-200/70 leading-relaxed">{t('tagline')}</p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-serif text-base font-semibold mb-4 text-cream-100">{t('shop')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/products"
                  className="text-cream-200/70 hover:text-emerald-400 transition-colors"
                >
                  {t('allProducts')}
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-cream-200/70 hover:text-emerald-400 transition-colors"
                >
                  {t('categories')}
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="text-cream-200/70 hover:text-emerald-400 transition-colors"
                >
                  {tNav('cart')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-serif text-base font-semibold mb-4 text-cream-100">
              {t('account')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/dashboard"
                  className="text-cream-200/70 hover:text-emerald-400 transition-colors"
                >
                  {t('dashboard')}
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-cream-200/70 hover:text-emerald-400 transition-colors"
                >
                  {tNav('login')}
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-cream-200/70 hover:text-emerald-400 transition-colors"
                >
                  {tNav('register')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-serif text-base font-semibold mb-4 text-cream-100">{t('legal')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-cream-200/70 hover:text-emerald-400 transition-colors"
                >
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-cream-200/70 hover:text-emerald-400 transition-colors"
                >
                  {t('privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-cream-200/10 pt-6 text-center text-xs text-cream-200/50">
          {t('copyright', { year })}
        </div>
      </div>
    </footer>
  );
}
