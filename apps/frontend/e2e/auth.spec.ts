import { test, expect } from '@playwright/test';

/**
 * Auth — register, login, logout.
 *
 * Uses a per-run unique email so re-runs don't hit "email already exists".
 * Clears cookies + storage at the start of each test so a stale session
 * from a previous test doesn't cause redirects.
 */

function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.test`;
}

const PASSWORD = 'Password123!';

// Ensure a clean session before each test in this file
test.beforeEach(async ({ context, page }) => {
  // Clear HTTP cookies
  await context.clearCookies();

  // Visit a page first so we have a document to run storage APIs on
  await page.goto('/en');

  // Clear any persisted auth state (Zustand persist, etc.)
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

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

    // Logged-in state: the header shows a Logout button
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe('Auth — login / logout', () => {
  test('logs in with the seeded admin and logs out', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;

    if (!email || !password) {
      test.skip(true, 'Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD in .env.test.local');
      return;
    }

    // ============================================
    // TEMPORARY CI DIAGNOSTICS
    // ============================================

    // Verify that Playwright received the GitHub Actions secrets
    // without exposing their actual values.
    console.log('E2E ADMIN EMAIL LENGTH:', email.length);
    console.log('E2E ADMIN PASSWORD LENGTH:', password.length);

    // Log the actual browser request sent to the backend.
    page.on('request', (request) => {
      if (request.url().includes('/auth/login')) {
        console.log('LOGIN REQUEST URL:', request.url());
        console.log('LOGIN REQUEST METHOD:', request.method());

        const body = request.postDataJSON?.();

        if (body) {
          console.log('LOGIN REQUEST EMAIL LENGTH:', body.email?.length ?? 0);

          console.log('LOGIN REQUEST PASSWORD LENGTH:', body.password?.length ?? 0);
        }

        console.log('LOGIN REQUEST HAS AUTH HEADER:', !!request.headers()['authorization']);
      }
    });

    // Log the login response returned to the browser.
    page.on('response', async (response) => {
      if (response.url().includes('/auth/login')) {
        console.log('LOGIN RESPONSE STATUS:', response.status());

        try {
          console.log('LOGIN RESPONSE BODY:', await response.text());
        } catch {
          console.log('LOGIN RESPONSE BODY: <unable to read>');
        }
      }
    });

    // ============================================
    // LOGIN
    // ============================================

    await page.goto('/en/login');

    // If we somehow land on a page without the email field,
    // bail early so the failure is descriptive instead of a timeout.
    const emailField = page.getByLabel(/^email$/i);

    await expect(emailField).toBeVisible({
      timeout: 5_000,
    });

    await emailField.fill(email);

    await page.getByLabel(/^password$/i).fill(password);

    await page.getByRole('button', { name: /^sign in$/i }).click();

    // Logged-in header shows a Logout button
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible({
      timeout: 15_000,
    });

    // ============================================
    // LOGOUT
    // ============================================

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

    // Should stay on login page
    await expect(page).toHaveURL(/\/en\/login/, {
      timeout: 10_000,
    });
  });
});
