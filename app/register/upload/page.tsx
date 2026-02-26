'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { RegisterUpload } from '@/components/register';
import { uploadRegisterDocument, processRegisterDocument } from '@/app/actions/register';

interface ProcessingStatus {
    step: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
    message: string;
    progress?: number;
    result?: {
        entriesFound: number;
        autoApproved: number;
        pendingReview: number;
    };
    error?: string;
}

function RegisterUploadContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [status, setStatus] = useState<ProcessingStatus>({
        step: 'idle',
        message: '',
    });

    const handleFileSelect = useCallback(async (file: File) => {
        if (!user?.email) {
            setStatus({ step: 'error', message: 'Please log in to upload documents', error: 'Not authenticated' });
            return;
        }

        try {
            // Step 1: Upload
            setStatus({ step: 'uploading', message: 'Uploading document...', progress: 25 });

            const formData = new FormData();
            formData.append('document', file);

            const uploadResult = await uploadRegisterDocument(formData, user.email);

            if (!uploadResult.success) {
                setStatus({
                    step: 'error',
                    message: uploadResult.message || 'Failed to upload document',
                    error: uploadResult.error,
                });
                return;
            }

            // Step 2: Process OCR
            setStatus({ step: 'processing', message: 'Processing with OCR...', progress: 50 });

            const processResult = await processRegisterDocument(uploadResult.documentId!, user.email);

            if (!processResult.success) {
                setStatus({
                    step: 'error',
                    message: processResult.message || 'Failed to process document',
                    error: processResult.error,
                });
                return;
            }

            // Step 3: Complete
            setStatus({
                step: 'complete',
                message: 'Processing complete!',
                progress: 100,
                result: {
                    entriesFound: processResult.entriesFound || 0,
                    autoApproved: processResult.autoApproved || 0,
                    pendingReview: processResult.pendingReview || 0,
                },
            });
        } catch (error) {
            console.error('[RegisterUpload] Error:', error);
            setStatus({
                step: 'error',
                message: 'An unexpected error occurred',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }, [user]);

    const handleReset = () => {
        setStatus({ step: 'idle', message: '' });
    };

    return (
        <AdminLayout>
            <div className="px-3 sm:p-6 py-4 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Upload Register
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Upload scanned gym register pages to digitize handwritten entries
                    </p>
                </div>

                {/* Status-based content */}
                {status.step === 'idle' && (
                    <RegisterUpload onFileSelect={handleFileSelect} />
                )}

                {status.step === 'uploading' && (
                    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                        <div className="animate-spin w-12 h-12 border-3 border-gray-200 border-t-black rounded-full mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Uploading Document</h3>
                        <p className="text-sm text-gray-500">{status.message}</p>
                        <div className="mt-4 max-w-xs mx-auto">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-black transition-all duration-500"
                                    style={{ width: `${status.progress || 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {status.step === 'processing' && (
                    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                        <div className="animate-pulse w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Processing with OCR</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Analyzing handwritten text and extracting entries...
                        </p>
                        <div className="max-w-xs mx-auto">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-500 animate-pulse"
                                    style={{ width: `${status.progress || 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {status.step === 'complete' && status.result && (
                    <div className="bg-white border border-gray-200 rounded-xl p-8">
                        {/* Success icon */}
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                            Processing Complete!
                        </h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Successfully extracted entries from the register
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 rounded-lg text-center">
                                <p className="text-2xl font-bold text-gray-900">{status.result.entriesFound}</p>
                                <p className="text-xs text-gray-500">Entries Found</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg text-center">
                                <p className="text-2xl font-bold text-green-600">{status.result.autoApproved}</p>
                                <p className="text-xs text-gray-500">Auto-Approved</p>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg text-center">
                                <p className="text-2xl font-bold text-yellow-600">{status.result.pendingReview}</p>
                                <p className="text-xs text-gray-500">Need Review</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            {status.result.pendingReview > 0 && (
                                <button
                                    onClick={() => router.push('/register/verify')}
                                    className="flex-1 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition"
                                >
                                    Review Entries
                                </button>
                            )}
                            <button
                                onClick={handleReset}
                                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                            >
                                Upload Another
                            </button>
                        </div>
                    </div>
                )}

                {status.step === 'error' && (
                    <div className="bg-white border border-red-200 rounded-xl p-8">
                        {/* Error icon */}
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>

                        <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                            Processing Failed
                        </h3>
                        <p className="text-sm text-red-600 text-center mb-2">
                            {status.message}
                        </p>
                        {status.error && (
                            <p className="text-xs text-gray-500 text-center mb-6">
                                Error: {status.error}
                            </p>
                        )}

                        <button
                            onClick={handleReset}
                            className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Quick links */}
                <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                    <Link
                        href="/register/verify"
                        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Verification Queue
                    </Link>
                    <Link
                        href="/members"
                        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Members List
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
}

export default function RegisterUploadPage() {
    return (
        <AuthGuard>
            <RegisterUploadContent />
        </AuthGuard>
    );
}
