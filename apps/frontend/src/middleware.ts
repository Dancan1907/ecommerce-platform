/**
 * Middleware
 *
 * Detects the user's preferred locale and redirects to /${locale}/path.
 * Handles:
 *  - Missing locale in URL (redirect to default or detected)
 *  - Locale detection from Accept-Language header
 *  - Cookie-based locale preference
 */

import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // Always show /en or /sw in URL
});

export const config = {
  // Match all paths except static files, API routes, and Next.js internals
  matcher: ['/((?!api|_next|_vercel|uploads|.*\\..*).*)'],
};
