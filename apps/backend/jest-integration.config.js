/**
 * Jest Configuration for Integration Tests
 *
 * Integration tests use .env.test (ecommerce_test_db).
 * Set NODE_ENV=test BEFORE Jest loads any modules
 * so ConfigModule picks the right env file.
 */

process.env.NODE_ENV = 'test';

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
