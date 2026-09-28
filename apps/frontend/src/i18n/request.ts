/**
 * Server-side i18n request config.
 *
 * Loads the appropriate messages file for the active locale.
 * next-intl v4 requires returning `locale` in the config.
 */

import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl v4 uses requestLocale() instead of locale param
  const locale = await requestLocale;

  // Validate the locale is supported
  if (!locale || !locales.includes(locale as Locale)) notFound();

  return {
    locale, // ← v4 requires this
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
