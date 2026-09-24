'use client';

/**
 * App Providers
 *
 * Client-side providers that wrap the entire app:
 *  - ThemeProvider (next-themes) — dark/light mode
 *  - Toaster (sonner) — toast notifications
 *  - SessionRestore — rehydrates auth + cart on mount
 */

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';

/**
 * Restores the user's session from tokens on mount.
 * Also loads the cart if the user is authenticated.
 */
function SessionRestore({ children }: { children: React.ReactNode }) {
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionRestore>{children}</SessionRestore>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className: 'glass-card',
        }}
      />
    </ThemeProvider>
  );
}
