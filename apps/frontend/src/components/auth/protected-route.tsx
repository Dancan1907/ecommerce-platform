'use client';

/**
 * ProtectedRoute
 *
 * Wraps pages that require authentication.
 * Redirects to /login with a `?next=` param if not authenticated.
 *
 * Shows a loading skeleton while the auth state is being restored.
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Skeleton } from '@/components/ui';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Optional: require a specific role */
  requiredRole?: 'ADMIN' | 'SELLER' | 'USER';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    // Wait until auth state is resolved
    if (isLoading) return;

    // Not logged in → redirect to login, remember where they were going
    if (!isAuthenticated) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
      return;
    }

    // Role check
    if (requiredRole && user?.role !== requiredRole) {
      router.replace('/'); // or a dedicated /unauthorized page
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, pathname]);

  // While resolving auth state
  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  // Not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Role mismatch
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Skeleton shown while the auth state is being restored.
 */
function AuthLoadingSkeleton() {
  return (
    <div className="container-page py-12 space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
