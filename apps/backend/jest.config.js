/**
 * Jest Configuration for Backend Testing
 *
 * Sets up Jest for testing the NestJS application:
 * - Uses ts-jest for TypeScript support
 * - Configures module path mapping
 * - Sets test environment to Node
 * - Collects coverage reports
 */

module.exports = {
  // ✅ Use ts-jest preset for TypeScript
  preset: 'ts-jest',

  // ✅ Node environment for backend testing
  testEnvironment: 'node',

  // ✅ Root directory for tests
  roots: ['<rootDir>/src'],

  // ✅ Match test files (*.spec.ts or *.test.ts)
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],

  // ✅ Path aliases (same as tsconfig paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@prisma/client$': '<rootDir>/node_modules/@prisma/client',
  },

  // ✅ Setup file for global test utilities (e.g., database cleanup, mocks)
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],

  // ✅ Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/test/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // ✅ Verbose output for easier debugging
  verbose: true,
};
