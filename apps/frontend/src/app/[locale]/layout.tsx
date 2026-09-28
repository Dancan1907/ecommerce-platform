import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { AppProviders } from '@/providers/app-providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import './globals.css';

// ============================================
// FONTS
// ============================================
// Fraunces — warm, artisanal serif for headings
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
});

// Plus Jakarta Sans — clean, modern body font
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

// ============================================
// SEO METADATA
// ============================================
export const metadata: Metadata = {
  title: {
    default: 'E-Commerce Platform — Curated Local Treasures',
    template: '%s | E-Commerce Platform',
  },
  description: 'Discover curated local treasures. Shop quality, artisanal goods, delivered fast.',
  keywords: ['ecommerce', 'kenya', 'artisanal', 'handmade', 'local'],
};

// ============================================
// ROOT LAYOUT
// ============================================
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${plusJakarta.variable}`}
    >
      <body className="font-sans flex min-h-screen flex-col bg-cream-200 text-ink-900 dark:bg-forest-950 dark:text-mint-200 transition-colors">
        <AppProviders>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
