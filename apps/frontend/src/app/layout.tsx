/**
 * Root Layout
 *
 * Minimal HTML shell. The locale-specific layout ([locale]/layout.tsx)
 * wraps everything with providers, header, footer, and i18n.
 */

import type { Metadata } from 'next';
import './[locale]/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'The Racing Shop — Curated Local Treasures',
    template: '%s | The Racing Shop',
  },
  description: 'Discover curated local treasures. Shop quality, artisanal goods, delivered fast.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
