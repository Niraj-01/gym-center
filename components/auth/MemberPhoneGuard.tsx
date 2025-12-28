'use client';

/**
 * MemberPhoneGuard - Protects member portal routes
 * For phone-authenticated members only (not Google-based members)
 */

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberAuth } from '@/contexts/MemberAuthContext';

export function MemberPhoneGuard({ children }: { children: ReactNode }) {
    const { memberSession, loading } = useMemberAuth();
    const router = useRouter();

    useEffect(() => {
        // If not loading and no member session, redirect to member login
        if (!loading && !memberSession) {
            router.push('/member/login');
        }
    }, [memberSession, loading, router]);

    // Show loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // If no session, show nothing (will redirect)
    if (!memberSession) {
        return null;
    }

    // Render children if authenticated
    return <>{children}</>;
}
