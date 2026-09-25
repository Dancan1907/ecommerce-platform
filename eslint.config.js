/**
 * ESLint v9+ Flat Configuration
 * Required for ESLint v9 and above
 */
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // ============================================
  // 1. GLOBAL IGNORES
  // (Standalone object — globally ignores these files)
  // ============================================
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '**/*.config.js',
      '**/*.config.ts',
      '.eslintrc.*',
      '**/*.d.ts',
      '**/jest.setup.ts',
      '**/jest-integration.config.js',
    ],
  },

  // ============================================
  // 2. Base ESLint recommended rules
  // ============================================
  js.configs.recommended,

  // ============================================
  // 3. TypeScript support
  // ============================================
  ...tseslint.configs.recommended,

  // ============================================
  // 4. Main configuration for TS/TSX files
  // ============================================
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // General rules
      'no-console': 'warn',
      'prefer-const': 'error',
    },
  },

  // ============================================
  // 5. Test file rules
  // ============================================
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/*.int-spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];
