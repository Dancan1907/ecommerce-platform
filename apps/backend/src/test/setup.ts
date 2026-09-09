/**
 * Jest Setup File
 *
 * Runs before any test starts.
 * - Sets up the testing environment
 * - Configures global variables
 * - Provides hooks for database cleanup
 */

import { PrismaClient } from '@prisma/client';

// ✅ Initialize Prisma client for test DB operations
const prisma = new PrismaClient();

// ✅ Global test timeout (30 seconds for DB-heavy operations)
jest.setTimeout(30000);

// ✅ Global environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-min-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-chars';

// ✅ Optional: mock console methods to keep test output clean
// console.log = jest.fn();
// console.error = jest.fn();

// ✅ Clean up database before each test suite (optional, depends on your needs)
beforeEach(async () => {
  // Example: clear categories table before each test
  await prisma.category.deleteMany();
});

// ✅ Disconnect Prisma after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
