/**
 * Home Page
 *
 * F1 merchandise landing page with translations.
 */

import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Truck, Shield, Package } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { ProductCard } from '@/components/products/product-card';
import { fetchCategories, fetchProducts } from '@/lib/products';
import type { Category, Product } from '@/types/product';

export const revalidate = 60;

export default async function HomePage() {
  let featuredProducts: Product[];
  let topCategories: Category[];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetchProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc', isActive: true }),
      fetchCategories(),
    ]);
    featuredProducts = productsRes.data;
    topCategories = categoriesRes.slice(0, 4);
  } catch {
    featuredProducts = [];
    topCategories = [];
  }

  const t = await getTranslations('home');
  const tProducts = await getTranslations('products');

  return (
    <div>
      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="container-page py-12 md:py-20">
        <Card variant="elevated" className="overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <span className="label-caps mb-4">{t('hero.eyebrow')}</span>
              <h1 className="font-serif text-4xl md:text-5xl font-semibold leading-tight text-ink-900 dark:text-mint-100 mb-6">
                {t('hero.title')}
              </h1>
              <p className="text-base md:text-lg text-ink-600 dark:text-mint-300 leading-relaxed mb-8">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/products">
                  <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    {t('hero.shopNow')}
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button variant="secondary" size="lg">
                    {t('hero.browseCategories')}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative h-64 md:h-auto md:min-h-[500px]">
              <Image
                src="https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=1200&q=80"
                alt="Formula 1 racing car on track"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </Card>
      </section>

      {/* ============================================
          FEATURED CATEGORIES
          ============================================ */}
      {topCategories.length > 0 && (
        <section className="container-page py-12">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="label-caps mb-2 block">{t('explore')}</span>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100">
                {t('hero.browseCategories')}
              </h2>
            </div>
            <Link
              href="/categories"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-forest-700 dark:text-emerald-500 hover:underline"
            >
              {tProducts('title')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topCategories.map((category) => (
              <Link key={category.id} href={`/categories/${category.slug}`} className="group">
                <Card className="overflow-hidden h-full">
                  <div className="relative aspect-square bg-gradient-to-br from-forest-700 via-forest-800 to-forest-900 dark:from-forest-800 dark:via-forest-900 dark:to-forest-950 flex items-center justify-center">
                    <Package className="h-12 w-12 text-cream-200/40" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-serif text-lg font-semibold text-cream-100 truncate">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============================================
          FEATURED PRODUCTS
          ============================================ */}
      <section className="container-page py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="label-caps mb-2 block">{t('newArrivals')}</span>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-ink-900 dark:text-mint-100">
              {tProducts('title')}
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-forest-700 dark:text-emerald-500 hover:underline"
          >
            {tProducts('title')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-ink-600 dark:text-mint-300 mb-4">{tProducts('noResults')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link href="/products">
            <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              {tProducts('title')}
            </Button>
          </Link>
        </div>
      </section>

      {/* ============================================
          TRUST FEATURES
          ============================================ */}
      <section className="container-page py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="group">
            <CardContent className="pt-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-forest-50 dark:bg-emerald-950/40 p-4 transition-colors group-hover:bg-forest-100 dark:group-hover:bg-emerald-900/50">
                  <Truck className="h-8 w-8 text-forest-700 dark:text-emerald-500" />
                </div>
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2 text-ink-900 dark:text-mint-100">
                {t('features.delivery.title')}
              </h3>
              <p className="text-sm text-ink-600 dark:text-mint-300 leading-relaxed">
                {t('features.delivery.description')}
              </p>
            </CardContent>
          </Card>

          <Card className="group">
            <CardContent className="pt-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-forest-50 dark:bg-emerald-950/40 p-4 transition-colors group-hover:bg-forest-100 dark:group-hover:bg-emerald-900/50">
                  <Shield className="h-8 w-8 text-forest-700 dark:text-emerald-500" />
                </div>
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2 text-ink-900 dark:text-mint-100">
                {t('features.payments.title')}
              </h3>
              <p className="text-sm text-ink-600 dark:text-mint-300 leading-relaxed">
                {t('features.payments.description')}
              </p>
            </CardContent>
          </Card>

          <Card className="group">
            <CardContent className="pt-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-forest-50 dark:bg-emerald-950/40 p-4 transition-colors group-hover:bg-forest-100 dark:group-hover:bg-emerald-900/50">
                  <Package className="h-8 w-8 text-forest-700 dark:text-emerald-500" />
                </div>
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2 text-ink-900 dark:text-mint-100">
                {t('features.quality.title')}
              </h3>
              <p className="text-sm text-ink-600 dark:text-mint-300 leading-relaxed">
                {t('features.quality.description')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
