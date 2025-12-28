'use client';

/**
 * Member Auth Context - Phone-based authentication for members
 * Separate from main AuthContext (which is for admin Google login)
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
    MemberSession,
    getMemberSession,
    createMemberSession,
    clearMemberSession,
    validatePhoneExists
} from '@/lib/auth/member-phone-auth';

interface MemberAuthContextValue {
    memberSession: MemberSession | null;
    loading: boolean;
    loginWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const MemberAuthContext = createContext<MemberAuthContextValue | undefined>(undefined);

export function MemberAuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [memberSession, setMemberSession] = useState<MemberSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session on mount
        const session = getMemberSession();
        setMemberSession(session);
        setLoading(false);
    }, []);

    const loginWithPhone = async (phone: string): Promise<{ success: boolean; error?: string }> => {
        try {
            // Validate phone format (10 digits)
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(phone)) {
                return { success: false, error: 'Please enter a valid 10-digit phone number' };
            }

            // Check if phone exists in database
            const member = await validatePhoneExists(phone);

            if (!member) {
                return { success: false, error: 'Phone number not found. Please contact gym admin.' };
            }

            // Create session
            createMemberSession(member.id, member.phone, member.name);
            setMemberSession({
                memberId: member.id,
                phone: member.phone,
                name: member.name,
                createdAt: new Date().toISOString()
            });

            // Redirect to member dashboard
            router.push('/member/dashboard');

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Failed to login. Please try again.' };
        }
    };

    const logout = () => {
        clearMemberSession();
        setMemberSession(null);
        router.push('/member/login');
    };

    return (
        <MemberAuthContext.Provider value={{ memberSession, loading, loginWithPhone, logout }}>
            {children}
        </MemberAuthContext.Provider>
    );
}

export function useMemberAuth() {
    const context = useContext(MemberAuthContext);
    if (context === undefined) {
        throw new Error('useMemberAuth must be used within a MemberAuthProvider');
    }
    return context;
}
