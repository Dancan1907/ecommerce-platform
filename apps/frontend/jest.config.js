/**
 * Jest Configuration for Frontend (Next.js)
 *
 * Uses:
 *  - jsdom environment (browser-like globals)
 *  - React Testing Library for component tests
 *
 * Note: next/jest supplies its own transformIgnorePatterns, which
 * overrides anything set inside the object passed to createJestConfig.
 * We therefore reassign transformIgnorePatterns AFTER createJestConfig
 * returns, so ESM-only deps (next-intl, use-intl, sonner, @formatjs)
 * get transformed by Babel/SWC.
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
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
  modulePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
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

module.exports = async () => {
  // Build the config Next.js wants, then override the transform allowlist.
  const config = await createJestConfig(customJestConfig)();

  config.transformIgnorePatterns = [
    'node_modules/(?!(.pnpm|next-intl|use-intl|sonner|@formatjs|intl-messageformat)/)',
  ];

  return config;
};
