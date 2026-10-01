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

test.describe('Admin — protected routes', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('anonymous user is redirected away from /admin', async ({ page }) => {
    await page.goto('/en/admin');
    // Expect a redirect to login
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

    // The admin products page has a "Create Product" button
    await expect(page.getByRole('button', { name: /create product/i })).toBeVisible({
      timeout: 10_000,
    });

    // And a table of products is rendered (at least the header cells)
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

    // Open the modal
    await page.getByRole('button', { name: /create product/i }).click();

    // Modal heading / dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // And the Product Name input is present
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

    await page.getByRole('button', { name: /create product/i }).click();

    // Fill the form
    await page.getByLabel(/product name/i).fill(name);
    await page.getByLabel(/description/i).fill('Automated test product — safe to delete.');
    await page.getByLabel(/price/i).fill('1000');
    await page.getByLabel(/stock/i).fill('5');
    await page.getByLabel(/sku/i).fill(sku);

    // Category — pick the first non-empty option
    const categorySelect = page.getByLabel(/category/i);
    const options = await categorySelect.locator('option').all();
    for (const opt of options) {
      const value = await opt.getAttribute('value');
      if (value) {
        await categorySelect.selectOption(value);
        break;
      }
    }

    // Submit — the submit button text is "Create Product" in the modal
    await page
      .getByRole('button', { name: /create product/i })
      .last()
      .click();

    // Toast: "Product created"
    await expect(page.getByText(/product created/i)).toBeVisible({ timeout: 10_000 });

    // The product name appears in the table
    await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
  });
});
