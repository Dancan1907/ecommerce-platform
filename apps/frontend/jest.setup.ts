/**
 * Jest Setup File
 *
 * Runs before each test file. Extends matchers and stubs
 * browser APIs that jsdom doesn't provide.
 */

import '@testing-library/jest-dom';

// Stub matchMedia (used by next-themes)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
