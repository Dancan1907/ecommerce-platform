/**
 * Integration Test Setup
 *
 * Runs before every integration test suite.
 * Boots the app, configures the test DB, and exposes helpers.
 */

import { INestApplication } from '@nestjs/common';

// Extend Jest's timeout for slow operations
jest.setTimeout(60000);

// Load test env file (must run before app bootstrap)
process.env.NODE_ENV = 'test';

// Silence noisy logs during tests (comment out if debugging)
// jest.spyOn(console, 'log').mockImplementation(() => undefined);

// Global test state
declare global {
  var __APP__: INestApplication;
}

afterAll(async () => {
  // Ensure any open app is closed
  if (global.__APP__) {
    await global.__APP__.close();
  }
});
