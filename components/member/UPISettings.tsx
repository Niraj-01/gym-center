'use client';

/**
 * UPI Settings Component
 * Allows members to view, add, and update their UPI ID for payments
 */

import { useState, useEffect } from 'react';
import { getMemberUPIByPhone, updateMemberUPI } from '@/app/actions/members';

interface UPISettingsProps {
    phone: string;
}

export default function UPISettings({ phone }: UPISettingsProps) {
    const [upiId, setUpiId] = useState('');
    const [savedUpiId, setSavedUpiId] = useState('');
    const [memberId, setMemberId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadUPI();
    }, [phone]);

    const loadUPI = async () => {
        try {
            setIsLoading(true);
            const result = await getMemberUPIByPhone(phone);

            if (result.memberId) {
                setMemberId(result.memberId);
            }

            if (result.upiId) {
                setSavedUpiId(result.upiId);
                setUpiId(result.upiId);
            } else {
                // No UPI saved, show input to add one
                setIsEditing(true);
            }
        } catch (err) {
            console.error('Failed to load UPI:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const validateUPI = (value: string) => {
        return /^[\w.-]+@[\w.-]+$/.test(value);
    };

    const handleSave = async () => {
        setError('');

        if (!upiId.trim()) {
            setError('UPI ID is required');
            return;
        }

        if (!validateUPI(upiId)) {
            setError('Invalid UPI ID format (e.g., yourname@paytm)');
            return;
        }

        if (!memberId) {
            setError('Member not found');
            return;
        }

        setIsSaving(true);

        try {
            const result = await updateMemberUPI(memberId, upiId);

            if (!result.success) {
                setError(result.error || 'Failed to save UPI ID');
                return;
            }

            setSavedUpiId(result.upiId || upiId.toLowerCase().trim());
            setIsEditing(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            setError('Failed to save UPI ID. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(savedUpiId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-12 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
            {/* Success Message */}
            {showSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-800 font-medium">UPI ID saved successfully!</span>
                </div>
            )}

            <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Settings</h3>

            {isEditing ? (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        UPI ID <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={upiId}
                        onChange={(e) => {
                            setUpiId(e.target.value);
                            setError('');
                        }}
                        placeholder="yourname@paytm"
                        className={`w-full px-4 py-3 text-lg border-2 rounded-xl outline-none transition-colors
                            ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
                        disabled={isSaving}
                    />
                    {error && (
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                        e.g., yourname@paytm, yourname@oksbi, yourname@ybl
                    </p>

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !upiId.trim()}
                            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSaving ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </span>
                            ) : (
                                'Save UPI ID'
                            )}
                        </button>
                        {savedUpiId && (
                            <button
                                onClick={() => {
                                    setUpiId(savedUpiId);
                                    setIsEditing(false);
                                    setError('');
                                }}
                                disabled={isSaving}
                                className="px-6 py-3 text-gray-600 font-semibold rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">💳</span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">UPI ID</p>
                            <p className="text-lg font-semibold text-gray-900">{savedUpiId}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={copyToClipboard}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            {copied ? '✓ Copied!' : 'Copy'}
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Edit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
