/**
 * Jest Configuration for Integration Tests
 *
 * CRITICAL: Load .env.test BEFORE any module import to ensure
 * Prisma Client reads the test DATABASE_URL on instantiation.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });

// Force NODE_ENV=test
process.env.NODE_ENV = 'test';

// Safety check
if (!process.env.DATABASE_URL?.includes('ecommerce_test_db')) {
  console.error('🚨 FATAL: Integration tests are using the WRONG database!');
  console.error(`   Expected: ecommerce_test_db`);
  console.error(`   Got: ${process.env.DATABASE_URL}`);
  process.exit(1);
}

console.log(
  '✅ Integration tests using:',
  process.env.DATABASE_URL?.replace(/:\/\/.*@/, '://***@')
);

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.int-spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/src/test/set-env.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/integration-setup.ts'],
  testTimeout: 60000,
  maxWorkers: 1,
  verbose: true,
};
