/**
 * Auth Layout
 *
 * Shared layout for all authentication pages:
 *  - Login, Register, Forgot/Reset Password, Verify Email
 *
 * Desktop: 2-column split (brand left, form right)
 * Mobile: Single column (form only)
 */

import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-12 md:py-20">
      <Card variant="elevated" className="overflow-hidden max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left: Brand side */}
          <div className="hidden md:flex flex-col justify-between bg-forest-800 dark:bg-forest-900 p-10 text-cream-200">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-12">
                <span className="font-serif text-3xl font-semibold text-cream-200">E</span>
                <span className="font-serif text-xl font-medium tracking-wide">E-Commerce</span>
              </Link>
              <span className="label-caps text-emerald-400 mb-4 block">Welcome</span>
              <h2 className="font-serif text-3xl font-semibold mb-4 leading-tight text-cream-100">
                Curated local treasures, delivered fast.
              </h2>
              <p className="text-cream-200/70 leading-relaxed">
                Shop quality, artisanal goods from talented creators across Kenya. Secure payments
                including M-Pesa.
              </p>
            </div>
            <div className="text-xs text-cream-200/50">
              © {new Date().getFullYear()} E-Commerce Platform
            </div>
          </div>

          {/* Right: Form side */}
          <div className="p-8 md:p-12 flex items-center">
            <div className="w-full max-w-md mx-auto">{children}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
