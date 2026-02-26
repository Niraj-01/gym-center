'use client';

/**
 * Auth Context - Manages admin authentication state
 * Uses simple email/password authentication against admins table
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
    getAdminSession,
    clearAdminSession,
    verifyAdminCredentials,
    createAdminSession,
    AdminSession,
} from '@/lib/auth/simple-auth';

interface AuthContextValue {
    user: AdminSession | null;
    loading: boolean;
    isAdmin: boolean;
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    // Initialize with consistent values for both server and client to avoid hydration mismatch
    const [user, setUser] = useState<AdminSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Read session from localStorage only on the client (after mount)
    useEffect(() => {
        const session = getAdminSession();
        if (session && session.isLoggedIn) {
            setUser(session);
            setIsAdmin(true);
        }
        setLoading(false);
    }, []);

    const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            // Verify credentials against admins table
            const isValid = await verifyAdminCredentials(email, password);

            if (!isValid) {
                return { success: false, error: 'Invalid email or password' };
            }

            // Create session
            createAdminSession(email);

            // Update state
            const session = getAdminSession();
            setUser(session);
            setIsAdmin(true);

            return { success: true };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: 'An error occurred. Please try again.' };
        }
    };

    const signOut = () => {
        clearAdminSession();
        setUser(null);
        setIsAdmin(false);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, signIn, signOut }}>
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
