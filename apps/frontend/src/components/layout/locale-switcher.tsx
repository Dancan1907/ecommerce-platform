'use client';

/**
 * Locale Switcher
 *
 * Dropdown that lets the user switch between supported languages.
 * Persists the choice via next-intl's built-in cookie mechanism.
 */

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Languages } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { localeNames, locales, type Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function switchLocale(newLocale: Locale) {
    setOpen(false);
    // next-intl's router preserves the current pathname but changes the locale prefix
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch language"
        aria-expanded={open}
        className="flex items-center gap-1.5 p-2 text-cream-200 hover:text-emerald-400 transition-colors"
      >
        <Languages className="h-5 w-5" />
        <span className="hidden sm:inline text-xs font-medium uppercase">{locale}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 rounded-lg border bg-white dark:bg-forest-900 border-cream-300 dark:border-forest-800 shadow-xl overflow-hidden z-50">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className={cn(
                'w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between',
                l === locale
                  ? 'bg-forest-800 text-cream-200 dark:bg-emerald-600 dark:text-white'
                  : 'text-ink-700 dark:text-mint-300 hover:bg-cream-200 dark:hover:bg-forest-800'
              )}
            >
              <span>{localeNames[l]}</span>
              {l === locale && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
