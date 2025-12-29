'use client';

/**
 * Access Denied Page - Shown when user is authenticated but not whitelisted as admin
 */

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AccessDeniedPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = () => {
        signOut();
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="w-full max-w-md p-12 bg-white border border-gray-200">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-black mb-3">Access Denied</h1>
                    <p className="text-base text-gray-600">
                        Your account is not authorized to access the GymCentre admin portal.
                    </p>
                </div>

                {/* User Info */}
                {user?.email && (
                    <div className="mb-8 pb-8 border-b border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">Signed in as:</p>
                        <p className="text-base font-medium text-black">{user.email}</p>
                    </div>
                )}

                {/* Info */}
                <div className="mb-10 text-sm text-gray-600 space-y-2">
                    <p>Only authorized administrators can access this portal.</p>
                    <p>Please contact your gym owner to request access.</p>
                </div>

                {/* Sign Out Button */}
                <button
                    onClick={handleSignOut}
                    className="w-full px-6 py-4 bg-black text-white hover:bg-gray-800 transition-colors font-medium mb-3"
                >
                    Sign Out
                </button>

                {/* Back to Login */}
                <button
                    onClick={() => router.push('/login')}
                    className="w-full px-6 py-4 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                    Back to Login
                </button>
            </div>
        </div>
    );
}
