/**
 * Jest Setup File
 *
 * This file runs before any test starts.
 * We DO NOT connect to the real database for unit tests.
 * All database operations should be mocked.
 */

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to keep test output clean (optional)
// console.log = jest.fn();
// console.error = jest.fn();

// Global test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-min-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-chars';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Clean up after all tests
afterAll(async () => {
  // Add global cleanup if needed
  // We don't need to clean a real database because we're mocking everything
});
