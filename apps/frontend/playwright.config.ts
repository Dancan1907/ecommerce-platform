import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 *
 * Runs E2E tests against a locally built Next.js app.
 *
 * Two projects (en, sw) exercise both locales. Tests use a baseURL
 * and the locale is chosen inside each spec via `test.use()` or a
 * helper, so a single spec can be run against both languages.
 *
 * webServer block: Playwright boots the built app before tests and
 * shuts it down after — no need to run `pnpm dev` manually.
 */

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',

  // Fail the build on CI if test.only is left in the source
  forbidOnly: !!process.env.CI,

  // Retry once on CI to smooth over flaky network calls
  retries: process.env.CI ? 1 : 0,

  // Serialize tests on CI; parallelize locally
  workers: process.env.CI ? 1 : undefined,

  // 'list' locally for readable output, 'github' on CI for annotations
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Boot the production build before tests. Reuses an already-running
  // server locally so you can keep `pnpm dev` open while iterating.
  webServer: {
    command: 'pnpm build && pnpm start',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
