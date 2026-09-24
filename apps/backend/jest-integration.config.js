/**
 * Jest Configuration for Integration Tests
 *
 * Integration tests:
 *  - Use a real PostgreSQL database (ecommerce_test_db)
 *  - Boot a real NestJS app
 *  - Send real HTTP requests via supertest
 *  - Mock external services (Stripe, M-Pesa Daraja)
 *
 * Files: *.int-spec.ts
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.int-spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/integration-setup.ts'],
  testTimeout: 60000, // 60s — real DB operations are slower
  maxWorkers: 1, // Run tests serially — they share the same test DB
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/test/**',
    '!src/**/*.spec.ts',
    '!src/**/*.int-spec.ts',
  ],
};
