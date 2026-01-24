'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PasswordStrength } from '@/components/PasswordStrength';
import { changeAdminPassword } from '@/app/actions/admin';

function SettingsContent() {
    const router = useRouter();
    const { user } = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        // Validation
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long');
            setIsLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            setIsLoading(false);
            return;
        }

        if (!user?.email) {
            setError('Session expired. Please login again.');
            setIsLoading(false);
            return;
        }

        try {
            const result = await changeAdminPassword(
                user.email,
                currentPassword,
                newPassword
            );

            if (result.success) {
                setSuccess('Password updated successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setError(result.error || 'Failed to change password');
            }
        } catch (err) {
            console.error('Password change error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8 pb-6 border-b border-gray-200">
                    <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage your account settings and change your password
                    </p>
                </div>

                {/* Account Info */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-lg font-semibold">
                            {user?.email?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{user?.email}</p>
                            <p className="text-sm text-gray-500">Administrator</p>
                        </div>
                    </div>
                </div>

                {/* Change Password Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Change Password</h2>

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-green-800">{success}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Change Password Form */}
                    <form onSubmit={handleChangePassword} className="space-y-5">
                        <div>
                            <label
                                htmlFor="currentPassword"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Current Password
                            </label>
                            <input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                placeholder="Enter your current password"
                                className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition placeholder:text-gray-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="newPassword"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Enter new password (min 6 characters)"
                                className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition placeholder:text-gray-400"
                            />
                            <PasswordStrength password={newPassword} />
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Re-enter new password"
                                className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition placeholder:text-gray-400"
                            />
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="mt-2 text-sm text-red-600">Passwords do not match</p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                                className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Updating...
                                    </span>
                                ) : (
                                    'Update Password'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/dashboard')}
                                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>

                {/* Security Tips */}
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Password Security Tips
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Use at least 8 characters (minimum 6 required)</li>
                        <li>• Include uppercase and lowercase letters</li>
                        <li>• Add numbers and special characters</li>
                        <li>• Don&apos;t use common words or personal information</li>
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
}

export default function SettingsPage() {
    return (
        <AuthGuard>
            <SettingsContent />
        </AuthGuard>
    );
}
