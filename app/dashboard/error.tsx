'use client';

/**
 * Dashboard Error Boundary
 * 
 * Catches errors in the dashboard route and displays a friendly message.
 * Provides a retry button to attempt recovery.
 * Only logs errors in development mode for security.
 */

import { useEffect } from 'react';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log error only in development for debugging
        if (process.env.NODE_ENV !== 'production') {
            console.error('[Dashboard Error]', error);
        }
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
                {/* Error Icon */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                        className="w-8 h-8 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                {/* Error Message */}
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Something went wrong
                </h2>
                <p className="text-gray-500 mb-6">
                    We couldn&apos;t load the dashboard. Please try again or contact support if the issue persists.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
