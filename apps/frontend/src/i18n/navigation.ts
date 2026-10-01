/**
 * Locale-Aware Navigation
 *
 * Wraps next-intl's createNavigation to provide locale-aware
 * Link, useRouter, usePathname, and redirect.
 *
 * Import from here instead of 'next/link' or 'next/navigation'
 * for any user-facing navigation.
 */

import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './config';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation({
  locales,
  defaultLocale,
});
