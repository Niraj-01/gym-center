'use client';

/**
 * AuthGuard - Protects admin-only routes
 * Redirects members to /me, unknown users to /access-denied
 */

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function AuthGuard({ children }: { children: ReactNode }) {
    const { user, loading, isAdmin, isMember } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not authenticated - go to login
                router.push('/login');
            } else if (isMember && !isAdmin) {
                // Is a member but not admin - redirect to member dashboard
                router.push('/me');
            } else if (!isAdmin && !isMember) {
                // Unknown user - access denied
                router.push('/access-denied');
            }
            // If isAdmin, allow access (do nothing)
        }
    }, [user, loading, isAdmin, isMember, router]);

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

    // If no user or not admin, show nothing (will redirect)
    if (!user || !isAdmin) {
        return null;
    }

    // Render children if authenticated AND is admin
    return <>{children}</>;
}
