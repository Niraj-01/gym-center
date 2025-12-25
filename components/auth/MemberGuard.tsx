'use client';

/**
 * MemberGuard - Protects member-only routes
 * Similar to AuthGuard but for members (not admins)
 */

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function MemberGuard({ children }: { children: ReactNode }) {
    const { user, loading, isMember } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If not loading and not a member, redirect to login
        if (!loading && (!user || !isMember)) {
            router.push('/login');
        }
    }, [user, loading, isMember, router]);

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

    // If no user or not a member, show nothing (will redirect)
    if (!user || !isMember) {
        return null;
    }

    // Render children if authenticated and is member
    return <>{children}</>;
}
