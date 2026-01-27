'use client';

/**
 * Members Error Boundary
 * 
 * Catches errors in the members route and displays a friendly message.
 * Provides a retry button to attempt recovery.
 * Only logs errors in development mode for security.
 */

import { useEffect } from 'react';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function MembersError({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log error only in development for debugging
        if (process.env.NODE_ENV !== 'production') {
            console.error('[Members Error]', error);
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
                            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                    </svg>
                </div>

                {/* Error Message */}
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Failed to load members
                </h2>
                <p className="text-gray-500 mb-6">
                    We couldn&apos;t load the members list. This might be a temporary issue. Please try again.
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
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
