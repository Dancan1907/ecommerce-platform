import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AppProviders } from '@/providers/app-providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { locales, type Locale } from '@/i18n/config';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: {
    default: 'The Racing Shop — Curated Local Treasures',
    template: '%s | The Racing Shop',
  },
  description: 'Discover curated local treasures. Shop quality, artisanal goods, delivered fast.',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <div
      className={`${fraunces.variable} ${plusJakarta.variable} font-sans flex min-h-screen flex-col bg-cream-200 text-ink-900 dark:bg-forest-950 dark:text-mint-200 transition-colors`}
      lang={locale}
    >
      <NextIntlClientProvider messages={messages}>
        <AppProviders>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AppProviders>
      </NextIntlClientProvider>
    </div>
  );
}
