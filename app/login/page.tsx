'use client';

/**
 * Login Page - Simple Email/Password Authentication
 * Enhanced with ambient background, form entrance animation, and interactive inputs.
 */

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GYM_NAME, PRODUCT_NAME } from '@/lib/config';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const router = useRouter();
    const { signIn, isAdmin, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && isAdmin) {
            router.push('/dashboard');
        }
    }, [loading, isAdmin, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const result = await signIn(email, password);

        if (!result.success) {
            setError(result.error || 'Login failed');
            setIsLoading(false);
            return;
        }

        // Redirect to dashboard
        router.push('/dashboard');
    };

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient background */}
            <AnimatedBackground variant="mesh" />

            <motion.div
                className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 relative z-10"
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Logo */}
                <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <motion.img
                        src="/logo.png"
                        alt="GymCentre"
                        className="h-12 mx-auto mb-4"
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <h1 className="text-3xl font-bold text-gray-900 animate-shimmer-text">{PRODUCT_NAME}</h1>
                    <motion.p
                        className="text-gray-600 mt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        Admin Portal for {GYM_NAME}
                    </motion.p>
                </motion.div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-sm text-red-800">{error}</p>
                    </motion.div>
                )}

                {/* Login Form */}
                <motion.form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    {/* Email Input */}
                    <motion.div
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 }}
                    >
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@example.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(var(--color-primary),0.1)]"
                        />
                    </motion.div>

                    {/* Password Input */}
                    <motion.div
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(var(--color-primary),0.1)]"
                        />
                    </motion.div>

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors animate-pulse-glow"
                        whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </motion.button>
                </motion.form>

                {/* Footer */}
                <motion.div
                    className="mt-6 pt-6 border-t border-gray-200 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <p className="text-sm text-gray-600">Admin access only</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Contact your gym owner for access
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
