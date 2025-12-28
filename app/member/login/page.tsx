'use client';

/**
 * Member Login Page - Phone-based authentication
 * Members scan QR or manually enter to access this page
 */

import { useState } from 'react';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { GYM_NAME } from '@/lib/config';

export default function MemberLoginPage() {
    const { loginWithPhone, loading } = useMemberAuth();
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await loginWithPhone(phone);

        if (!result.success) {
            setError(result.error || 'Failed to login');
            setIsLoading(false);
        }
        // If successful, MemberAuthContext will redirect to dashboard
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length <= 10) {
            setPhone(value);
            setError(''); // Clear error on input change
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <img
                        src="/logo.png"
                        alt="GymCentre"
                        className="h-10 sm:h-12 mx-auto mb-6"
                    />
                    <div className="inline-block p-4 bg-blue-600 rounded-full mb-4">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{GYM_NAME}</h1>
                    <p className="text-gray-600">Member Portal</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Phone Input */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-gray-500">+91</span>
                                </div>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    placeholder="Enter mobile number"
                                    className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                                    required
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                    autoComplete="tel"
                                    autoFocus
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">Enter your 10-digit mobile number</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={phone.length !== 10 || isLoading}
                            className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg disabled:shadow-none"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Signing In...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Help Text */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600 text-center">
                            Not a member yet?{' '}
                            <a href="tel:" className="text-blue-600 font-medium hover:underline">
                                Contact gym admin
                            </a>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>Scan QR code at gym entrance for quick access</p>
                </div>
            </div>
        </div>
    );
}
