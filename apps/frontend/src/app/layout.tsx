/**
 * Root Layout
 *
 * Minimal shell. The full app layout with providers, header, footer,
 * and i18n lives in [locale]/layout.tsx.
 *
 * This root layout exists to satisfy Next.js's requirement and to
 * render the global 404 and error pages.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'E-Commerce Platform',
    template: '%s | E-Commerce Platform',
  },
  description: 'Discover curated local treasures.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
