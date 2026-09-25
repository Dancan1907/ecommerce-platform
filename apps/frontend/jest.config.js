/**
 * Jest Configuration for Frontend (Next.js)
 *
 * Uses:
 *  - jsdom environment (browser-like globals)
 *  - ts-jest for TypeScript support
 *  - React Testing Library for component tests
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Path to Next.js app — used to load next.config.js and .env files
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/layout.tsx',
    '!src/**/page.tsx',
    '!src/**/*.test.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};

module.exports = createJestConfig(customJestConfig);
