'use client';

import { ProtectedRoute } from '@/components/auth';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="container-page py-12">
        <h1 className="font-serif text-4xl font-semibold mb-4">Welcome to your dashboard</h1>
        <p className="text-ink-600 dark:text-mint-300">
          This is a protected page. You can only see this if you&apos;re logged in.
        </p>
      </div>
    </ProtectedRoute>
  );
}
