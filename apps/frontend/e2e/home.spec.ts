import { test, expect } from '@playwright/test';

/**
 * Home page smoke test.
 *
 * Verifies the landing page loads, the header renders the brand,
 * and the primary hero call-to-action is present. Runs against
 * both /en and /sw via the LOCALES loop below.
 *
 * Locale-aware assertions: expected copy differs per locale, so
 * the "shop CTA" test uses a per-locale pattern instead of a
 * hardcoded English string.
 */

const LOCALES = ['en', 'sw'] as const;

// Per-locale expected strings for the hero CTA buttons.
const HERO_CTA: Record<(typeof LOCALES)[number], RegExp> = {
  en: /shop now/i,
  sw: /nunua sasa/i,
};

for (const locale of LOCALES) {
  test.describe(`Home page (${locale})`, () => {
    test('loads and shows the brand in the header', async ({ page }) => {
      await page.goto(`/${locale}`);

      // Brand name appears in the header (same across locales)
      await expect(page.getByRole('link', { name: 'The Racing Shop' })).toBeVisible();

      // Hero heading exists
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('shows the primary shop CTA', async ({ page }) => {
      await page.goto(`/${locale}`);

      // Match the hero CTA in the correct language for this locale
      const shopCta = page.getByRole('link', { name: HERO_CTA[locale] });
      await expect(shopCta.first()).toBeVisible();
    });
  });
}
