'use client';

/**
 * Auth Context - Manages authentication state across the app
 * Provider-agnostic - works with any AuthProvider implementation
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/lib/auth/types';
import { authProvider } from '@/lib/auth/auth-provider';

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = authProvider.onAuthStateChanged(async (user) => {
            setUser(user);

            // Check admin status if user exists
            if (user?.email) {
                const adminStatus = await authProvider.isAdminEmail(user.email);
                setIsAdmin(adminStatus);
            } else {
                setIsAdmin(false);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        try {
            await authProvider.signInWithGoogle();
        } catch (error) {
            console.error('Sign in failed:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await authProvider.signOut();
        } catch (error) {
            console.error('Sign out failed:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, signInWithGoogle, signOut }}>
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
