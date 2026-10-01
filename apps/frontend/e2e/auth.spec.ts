import { test, expect } from '@playwright/test';

/**
 * Auth — register, login, logout.
 *
 * Uses a per-run unique email so re-runs don't hit "email already exists".
 * Logout is asserted via the header nav returning to a logged-out state.
 */

function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.test`;
}

const PASSWORD = 'Password123!';

test.describe('Auth — register', () => {
  test('registers a new user and lands on a logged-in page', async ({ page }) => {
    const email = uniqueEmail();

    await page.goto('/en/register');

    await page.getByLabel(/first name/i).fill('E2E');
    await page.getByLabel(/last name/i).fill('Tester');
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/^password$/i).fill(PASSWORD);
    await page.getByLabel(/confirm password/i).fill(PASSWORD);

    await page.getByRole('button', { name: /create account/i }).click();

    // After successful registration, the user should be either on
    // a dashboard page or redirected home — the common signal is
    // that the "Logout" button appears in the header.
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe('Auth — login / logout', () => {
  test('logs in with the seeded admin and logs out', async ({ page }) => {
    // Use the real admin account
    const email = process.env.E2E_ADMIN_EMAIL ?? 'dancankalerwa@gmail.com';
    const password = process.env.E2E_ADMIN_PASSWORD;

    if (!password) {
      test.skip(true, 'Set E2E_ADMIN_PASSWORD env var to run this test');
      return;
    }

    await page.goto('/en/login');
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/^password$/i).fill(password);
    await page.getByRole('button', { name: /^sign in$/i }).click();

    // Logged-in header shows a Logout button
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible({
      timeout: 15_000,
    });

    // Log out
    await page.getByRole('button', { name: /logout/i }).click();

    // Sign Up button should be back
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('rejects an invalid password', async ({ page }) => {
    await page.goto('/en/login');

    await page.getByLabel(/^email$/i).fill('definitely-not-a-user@example.test');
    await page.getByLabel(/^password$/i).fill('wrong-password');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    // Should stay on login page (or show error)
    await expect(page).toHaveURL(/\/en\/login/, { timeout: 10_000 });
  });
});
