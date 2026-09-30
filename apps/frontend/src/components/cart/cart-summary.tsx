'use client';

/**
 * Cart Summary
 *
 * Reusable summary card with translations.
 */

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Truck } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { formatKES } from '@/lib/utils';

const FLAT_SHIPPING_COST = 250;

export interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  showCheckoutButton?: boolean;
  className?: string;
}

export function CartSummary({
  subtotal,
  itemCount,
  showCheckoutButton = true,
  className,
}: CartSummaryProps) {
  const t = useTranslations('cart');
  const shipping = itemCount > 0 ? FLAT_SHIPPING_COST : 0;
  const total = subtotal + shipping;

  return (
    <Card className={`p-6 ${className ?? ''}`}>
      <h2 className="font-serif text-xl font-semibold text-ink-900 dark:text-mint-100 mb-6">
        {t('summary')}
      </h2>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-ink-600 dark:text-mint-300">
            {t('subtotalWithCount', { count: itemCount })}
          </span>
          <span className="text-ink-900 dark:text-mint-100 font-medium">{formatKES(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1.5 text-ink-600 dark:text-mint-300">
            <Truck className="h-3.5 w-3.5" />
            {t('shipping')}
          </span>
          <span className="text-ink-900 dark:text-mint-100 font-medium">
            {shipping > 0 ? formatKES(shipping) : '—'}
          </span>
        </div>

        <div className="border-t border-cream-300 dark:border-forest-800 pt-3 flex justify-between">
          <span className="font-serif text-lg font-semibold text-ink-900 dark:text-mint-100">
            {t('total')}
          </span>
          <span className="font-serif text-lg font-semibold text-forest-800 dark:text-emerald-400">
            {formatKES(total)}
          </span>
        </div>
      </div>

      {showCheckoutButton && (
        <Link href="/checkout">
          <Button
            size="lg"
            className="w-full"
            disabled={itemCount === 0}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            {t('checkout')}
          </Button>
        </Link>
      )}

      <p className="text-xs text-ink-500 dark:text-mint-300/70 mt-4 text-center">
        {t('shippingCalculated')}
      </p>
    </Card>
  );
}
