import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 *
 * Runs E2E tests against a locally built Next.js app.
 *
 * Env vars for admin credentials are loaded in globalSetup so they
 * reach test workers (the config file's process.env does not always
 * propagate to workers).
 *
 * Local dev: Playwright boots the production build via `webServer`.
 * CI: the GitHub Actions workflow starts the backend and frontend
 *     explicitly, so we skip `webServer` here to avoid double builds
 *     and port conflicts.
 */

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',

  // Load env vars once, before any worker starts
  globalSetup: './e2e/global-setup.ts',

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

  // Only boot the webServer locally. On CI, the workflow starts both
  // apps explicitly so we control order (backend first, frontend after).
  ...(process.env.CI
    ? {}
    : {
        webServer: {
          command: 'pnpm build && pnpm start',
          url: BASE_URL,
          reuseExistingServer: true,
          timeout: 120_000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
      }),
});
