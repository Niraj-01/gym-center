'use client';

/**
 * AuthGuard - Protects admin-only routes
 * Redirects unauthenticated users to login page
 */

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function AuthGuard({ children }: { children: ReactNode }) {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/login');
        }
    }, [loading, isAdmin, router]);

    // Show loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // If not admin, show nothing (will redirect)
    if (!isAdmin) {
        return null;
    }

    // Render children if authenticated admin
    return <>{children}</>;
}
