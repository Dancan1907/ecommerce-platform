import { test, expect } from '@playwright/test';

/**
 * Products — listing, filtering, detail page, add to cart.
 *
 * Assumes the DB has the 10 F1 demo products (see Phase 2).
 * If the DB is reset, either re-seed manually via admin or run
 * the product linking script.
 */

test.describe('Products — listing', () => {
  test('/en/products lists products', async ({ page }) => {
    await page.goto('/en/products');

    // At least one product card with a name heading should appear
    await expect(page.getByRole('heading', { name: /blue energy racing helmet/i })).toBeVisible({
      timeout: 10_000,
    });

    // The heading "All Products" appears on the listing page
    await expect(page.getByRole('heading', { name: /all products/i })).toBeVisible();
  });

  test('search box filters results', async ({ page }) => {
    await page.goto('/en/products');

    // Type into the search box in the filter sidebar
    const search = page.getByPlaceholder(/search products/i);
    await search.fill('helmet');

    // Either the URL updates or the visible results narrow —
    // we assert that at least one helmet product is still visible
    // and that a non-matching item (e.g., "Polo") is not.
    await expect(page.getByRole('heading', { name: /helmet/i }).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('heading', { name: /silver arrow team polo/i })).toHaveCount(0);
  });
});

test.describe('Products — detail page', () => {
  test('opens a product and shows name, price, and add-to-cart', async ({ page }) => {
    await page.goto('/en/products');

    // Click the first helmet card
    await page
      .getByRole('link', { name: /blue energy racing helmet/i })
      .first()
      .click();

    // Detail page assertions
    await expect(page.locator('h1')).toContainText(/blue energy racing helmet/i, {
      timeout: 10_000,
    });
    await expect(page.getByText(/KSh\s*12,?500/)).toBeVisible();
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible();
  });

  test('add to cart requires sign-in when logged out', async ({ page }) => {
    await page.goto('/en/products/blue-energy-racing-helmet');

    // Ensure we're logged out (clear cookies to be safe)
    await page.context().clearCookies();
    await page.reload();

    // Click add to cart — expect redirect to login
    const addToCart = page.getByRole('button', { name: /add to cart/i });
    await addToCart.click();

    // Should land on the login page (or show a toast pointing there)
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 10_000 });
  });
});
