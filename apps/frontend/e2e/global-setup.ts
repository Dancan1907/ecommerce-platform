import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

/**
 * Global setup for Playwright.
 *
 * Loads .env.test.local so E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD are
 * available in test workers. Uses an absolute path so it works no
 * matter what CWD the workers start in.
 */
export default async function globalSetup() {
  const envPath = resolve(__dirname, '..', '.env.test.local');
  const result = loadEnv({ path: envPath });

  if (result.error) {
    console.warn(`⚠️  Could not load ${envPath}: ${result.error.message}`);
  } else {
    console.log(`✅ Loaded env from ${envPath} (${Object.keys(result.parsed ?? {}).length} vars)`);
  }
}
