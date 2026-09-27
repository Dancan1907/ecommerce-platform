/**
 * ESLint v9+ Flat Configuration
 */
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // ============================================
  // 1. GLOBAL IGNORES (standalone object)
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

  // 2. Base ESLint recommended
  js.configs.recommended,

  // 3. TypeScript support
  ...tseslint.configs.recommended,

  // ============================================
  // 4. Main config for TS/TSX files
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
      'react-hooks': reactHooks,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General
      'no-console': 'warn',
      'prefer-const': 'error',
    },
  },

  // ============================================
  // 5. Test file overrides
  // ============================================
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/*.int-spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];
