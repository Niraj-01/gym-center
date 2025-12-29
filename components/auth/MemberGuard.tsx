'use client';

/**
 * MemberGuard - DEPRECATED
 * This guard was for Google-authenticated members.
 * Now redirects to member phone login since Google auth is removed.
 * 
 * For member portal routes, use MemberPhoneGuard instead.
 */

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export function MemberGuard({ children }: { children: ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        // Redirect to member phone login since Google auth is removed
        router.push('/member/login');
    }, [router]);

    // Show loading while redirecting
    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">Redirecting...</p>
            </div>
        </div>
    );
}
