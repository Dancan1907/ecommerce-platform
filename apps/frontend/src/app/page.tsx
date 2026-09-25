/**
 * Home Page
 *
 * Artisanal marketplace landing page.
 * Warm, editorial layout with serif hero and hero image.
 */

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Truck, Shield, Package } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

export default function HomePage() {
  return (
    <div>
      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="container-page py-12 md:py-20">
        <Card variant="elevated" className="overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: Text */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <span className="label-caps mb-4">Curated in Kenya</span>
              <h1 className="font-serif text-4xl md:text-5xl font-semibold leading-tight text-ink-900 dark:text-mint-100 mb-6">
                Discover curated local treasures.
              </h1>
              <p className="text-base md:text-lg text-ink-600 dark:text-mint-300 leading-relaxed mb-8">
                Shop quality, artisanal goods, delivered fast. Experience unique products from
                talented local creators. Secure payments, including direct M-Pesa.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/products">
                  <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Shop Now
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button variant="secondary" size="lg">
                    Browse Categories
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Hero image */}
            <div className="relative h-64 md:h-auto md:min-h-[500px]">
              <Image
                src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1200&q=80"
                alt="Curated collection of artisanal goods: baskets, pottery, notebooks"
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
          FEATURE CARDS
          ============================================ */}
      <section className="container-page py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="group">
            <CardContent className="pt-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-forest-50 dark:bg-emerald-950/40 p-4 transition-colors group-hover:bg-forest-100 dark:group-hover:bg-emerald-900/50">
                  <Truck className="h-8 w-8 text-forest-700 dark:text-emerald-500" />
                </div>
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2 text-ink-900 dark:text-mint-100">
                Fast Delivery
              </h3>
              <p className="text-sm text-ink-600 dark:text-mint-300 leading-relaxed">
                Same-day delivery in Nairobi, next-day upcountry.
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
                Secure Payments
              </h3>
              <p className="text-sm text-ink-600 dark:text-mint-300 leading-relaxed">
                Pay securely with M-Pesa, card, or other methods.
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
                Quality Products
              </h3>
              <p className="text-sm text-ink-600 dark:text-mint-300 leading-relaxed">
                Curated selection from trusted local sellers.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
