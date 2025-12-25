'use client';

/**
 * Login Page - Google Sign-In
 * TODO: Replace mock sign-in with Firebase Google Auth popup
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GYM_NAME, PRODUCT_NAME } from '@/lib/config';

export default function LoginPage() {
    const { user, loading, isAdmin, signInWithGoogle } = useAuth();
    const router = useRouter();
    const [isSigningIn, setIsSigningIn] = useState(false);

    useEffect(() => {
        // If already authenticated and admin, redirect to dashboard
        if (!loading && user && isAdmin) {
            router.push('/dashboard');
        }
    }, [user, loading, isAdmin, router]);

    const handleSignIn = async () => {
        setIsSigningIn(true);
        try {
            await signInWithGoogle();
            // After sign-in, AuthContext will check admin status
            // If admin, user will be redirected via useEffect above
        } catch (error) {
            console.error('Sign in error:', error);
            alert('Failed to sign in. Please try again.');
        } finally {
            setIsSigningIn(false);
        }
    };

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

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="w-full max-w-md p-12 bg-white border border-gray-200">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-black mb-2">{PRODUCT_NAME}</h1>
                    <p className="text-base text-gray-600">Admin Portal for {GYM_NAME}</p>
                </div>

                {/* Sign In Button */}
                <button
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {/* Google Icon */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    <span className="font-medium">
                        {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
                    </span>
                </button>

                {/* Info Text */}
                <div className="mt-8 text-sm text-gray-500">
                    <p>Admin access only</p>
                    <p className="mt-1">Contact your gym owner for access</p>
                </div>

                {/* Dev Mode Notice - Simplified */}
                <div className="mt-12 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-400">
                        Dev Mode: Using mock authentication
                    </p>
                </div>
            </div>
        </div>
    );
}
