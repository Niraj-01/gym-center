'use client';

/**
 * Auth Context - Manages authentication state across the app
 * Provider-agnostic - works with any AuthProvider implementation
 * NOW includes role resolution: Admin vs Member vs Unknown
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth/types';
import { authProvider } from '@/lib/auth/auth-provider';
import { getMemberByEmail } from '@/lib/services/mock-firestore';

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    isMember: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMember, setIsMember] = useState(false);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = authProvider.onAuthStateChanged(async (user) => {
            setUser(user);

            if (user?.email) {
                // Role Resolution (MANDATORY ORDER)
                await resolveUserRole(user.email);
            } else {
                setIsAdmin(false);
                setIsMember(false);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const resolveUserRole = async (email: string) => {
        try {
            // 1. Check admin whitelist FIRST
            const adminStatus = await authProvider.isAdminEmail(email);
            if (adminStatus) {
                setIsAdmin(true);
                setIsMember(false);
                router.push('/dashboard');
                return;
            }

            // 2. Check members collection
            const member = await getMemberByEmail(email);
            if (member) {
                setIsAdmin(false);
                setIsMember(true);
                router.push('/me');
                return;
            }

            // 3. Unknown user - redirect to access denied
            setIsAdmin(false);
            setIsMember(false);
            router.push('/access-denied');
        } catch (error) {
            console.error('Role resolution error:', error);
            setIsAdmin(false);
            setIsMember(false);
        }
    };

    const signInWithGoogle = async () => {
        try {
            await authProvider.signInWithGoogle();
            // Role resolution happens in onAuthStateChanged
        } catch (error) {
            console.error('Sign in failed:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await authProvider.signOut();
            setIsAdmin(false);
            setIsMember(false);
            router.push('/login');
        } catch (error) {
            console.error('Sign out failed:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, isMember, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
