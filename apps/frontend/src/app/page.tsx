/**
 * Home Page
 *
 * Placeholder home page for Phase 5D.
 * Will be rebuilt with hero, featured products, and categories in Phase 5E.
 */

import Link from 'next/link';
import { ArrowRight, Package, Shield, Truck } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            E-Commerce
          </span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Discover amazing products from local sellers. Fast delivery, secure payments with M-Pesa
          or card.
        </p>
        <div className="flex justify-center gap-3">
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
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6 py-12">
        <Card>
          <CardContent className="pt-6 text-center">
            <Truck className="h-10 w-10 mx-auto mb-3 text-indigo-600" />
            <h3 className="font-semibold mb-2">Fast Delivery</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Same-day delivery in Nairobi, next-day upcountry.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-10 w-10 mx-auto mb-3 text-indigo-600" />
            <h3 className="font-semibold mb-2">Secure Payments</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pay with M-Pesa, card, or other methods securely.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Package className="h-10 w-10 mx-auto mb-3 text-indigo-600" />
            <h3 className="font-semibold mb-2">Quality Products</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Curated selection from trusted sellers.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
