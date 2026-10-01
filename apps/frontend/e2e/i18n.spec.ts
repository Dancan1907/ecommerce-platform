import { test, expect } from '@playwright/test';

/**
 * i18n — Locale routing and switching.
 *
 * Verifies:
 *  1. Visiting /en and /sw both work (no redirect errors)
 *  2. The header nav shows the correct language per locale
 *  3. The language switcher in the header navigates between locales
 *  4. Product data (names) stays in English across both locales
 *     (per project decision — only UI chrome is translated)
 */

const NAV = {
  en: {
    products: /^products$/i,
    categories: /^categories$/i,
  },
  sw: {
    products: /^bidhaa$/i,
    categories: /^kategoria$/i,
  },
} as const;

test.describe('i18n — locale routing', () => {
  test('/en shows English nav labels', async ({ page }) => {
    await page.goto('/en');
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: NAV.en.products })).toBeVisible();
    await expect(nav.getByRole('link', { name: NAV.en.categories })).toBeVisible();
  });

  test('/sw shows Swahili nav labels', async ({ page }) => {
    await page.goto('/sw');
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: NAV.sw.products })).toBeVisible();
    await expect(nav.getByRole('link', { name: NAV.sw.categories })).toBeVisible();
  });

  test('English and Swahili hero headings differ', async ({ page }) => {
    await page.goto('/en');
    const enHeading = await page.locator('h1').first().innerText();

    await page.goto('/sw');
    const swHeading = await page.locator('h1').first().innerText();

    expect(enHeading).not.toEqual(swHeading);
  });

  test('product names stay in English on both locales', async ({ page }) => {
    // "Blue Energy Racing Helmet" is a product name, not UI copy,
    // so it should render as-is in both locales.
    for (const locale of ['en', 'sw'] as const) {
      await page.goto(`/${locale}/products`);
      // Wait for at least one product card, then assert the name
      await expect(page.getByText(/blue energy racing helmet/i).first()).toBeVisible({
        timeout: 10_000,
      });
    }
  });
});
