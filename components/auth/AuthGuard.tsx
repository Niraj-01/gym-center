'use client';

/**
 * Auth Guard - Protects routes from unauthorized access
 * Redirects to login if not authenticated or not admin
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            // Not authenticated - redirect to login
            if (!user) {
                router.push('/login');
                return;
            }

            // Authenticated but not admin - show access denied
            if (!isAdmin) {
                router.push('/access-denied');
                return;
            }
        }
    }, [user, loading, isAdmin, router]);

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

    // Not authenticated or not admin - don't render protected content
    if (!user || !isAdmin) {
        return null;
    }

    // User is authenticated and is admin - render protected content
    return <>{children}</>;
}
