'use client';

/**
 * Add Member Error Boundary
 * 
 * Catches errors in the add member route and displays a friendly message.
 * Provides options to retry or go back to members list.
 * Only logs errors in development mode for security.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function AddMemberError({ error, reset }: ErrorProps) {
    const router = useRouter();

    useEffect(() => {
        // Log error only in development for debugging
        if (process.env.NODE_ENV !== 'production') {
            console.error('[Add Member Error]', error);
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
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                {/* Error Message */}
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Couldn&apos;t load the form
                </h2>
                <p className="text-gray-500 mb-6">
                    There was a problem loading the add member form. Please try again or go back to the members list.
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
                        onClick={() => router.push('/members')}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                    >
                        Back to Members
                    </button>
                </div>
            </div>
        </div>
    );
}
