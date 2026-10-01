import { test, expect } from '@playwright/test';

/**
 * Admin — authenticated admin flows.
 *
 * Assumes E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD are set in .env.test.local
 * and the logged-in user has role ADMIN.
 *
 * Skips gracefully if credentials are missing (local dev without env).
 */

function uniqueSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

async function loginAsAdmin(
  page: import('@playwright/test').Page,
  email: string,
  password: string
) {
  await page.goto('/en/login');
  await page.getByLabel(/^email$/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('button', { name: /logout/i })).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Waits for the admin products page to finish its initial load.
 * Detects the end of the skeleton by waiting for either the products
 * table or the "empty" state to appear.
 */
async function waitForProductsReady(page: import('@playwright/test').Page) {
  // The create button is always in the header, but the page re-renders
  // while data loads. Wait for the search input to become visible
  // (it only appears once the header is stable).
  await expect(page.getByPlaceholder(/search products/i)).toBeVisible({
    timeout: 15_000,
  });

  // Then wait for the table (or empty state) to finish loading.
  // The skeleton uses the Skeleton component; once products or empty
  // state render, skeletons are gone. Either way, the Create button
  // is now stable.
  await expect(page.getByRole('button', { name: /create product/i }).first()).toBeVisible({
    timeout: 15_000,
  });

  // Give React one paint cycle to finish any pending re-render
  await page.waitForTimeout(300);
}

test.describe('Admin — protected routes', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('anonymous user is redirected away from /admin', async ({ page }) => {
    await page.goto('/en/admin');
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 10_000 });
  });

  test('admin can reach /admin/products and see the Create button', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;

    if (!email || !password) {
      test.skip(true, 'Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD in .env.test.local');
      return;
    }

    await loginAsAdmin(page, email, password);
    await page.goto('/en/admin/products');
    await waitForProductsReady(page);

    await expect(page.getByRole('button', { name: /create product/i }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /product/i })).toBeVisible();
  });

  test('admin can open the Create Product modal', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;

    if (!email || !password) {
      test.skip(true, 'Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD in .env.test.local');
      return;
    }

    await loginAsAdmin(page, email, password);
    await page.goto('/en/admin/products');
    await waitForProductsReady(page);

    // Click — force:true bypasses the re-render race; button is present
    await page
      .getByRole('button', { name: /create product/i })
      .first()
      .click({ force: true });

    // Modal appears (your Modal component uses a dialog role)
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // Product Name field appears
    await expect(page.getByLabel(/product name/i)).toBeVisible();
  });

  test('admin can create a new product and see it in the list', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;

    if (!email || !password) {
      test.skip(true, 'Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD in .env.test.local');
      return;
    }

    const suffix = uniqueSuffix();
    const name = `E2E Test Product ${suffix}`;
    const sku = `E2E-${suffix}`;

    await loginAsAdmin(page, email, password);
    await page.goto('/en/admin/products');
    await waitForProductsReady(page);

    await page
      .getByRole('button', { name: /create product/i })
      .first()
      .click({ force: true });

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Scope every field lookup to the modal to avoid ambiguity with the page
    await dialog.getByLabel(/product name/i).fill(name);
    await dialog.getByLabel(/description/i).fill('Automated test product — safe to delete.');
    await dialog.getByLabel(/price/i).fill('1000');
    await dialog.getByLabel(/stock/i).fill('5');
    await dialog.getByLabel(/sku/i).fill(sku);

    // Category — pick the first non-empty option
    const categorySelect = dialog.getByLabel(/category/i);
    const options = await categorySelect.locator('option').all();
    for (const opt of options) {
      const value = await opt.getAttribute('value');
      if (value) {
        await categorySelect.selectOption(value);
        break;
      }
    }

    // Submit — scoped to the modal to avoid the header's Create button
    await dialog.getByRole('button', { name: /create product/i }).click();

    // Toast confirms success
    await expect(page.getByText(/product created/i)).toBeVisible({ timeout: 10_000 });

    // The new product is in the table
    await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
  });
});
