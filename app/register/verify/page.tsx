'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DocumentViewer, VerificationForm } from '@/components/register';
import {
    getVerificationQueue,
    getVerificationStats,
    approveEntry,
    skipEntry,
    rejectEntry,
    VerificationQueueItem,
} from '@/app/actions/register';

function VerificationContent() {
    const { user } = useAuth();
    const [queue, setQueue] = useState<VerificationQueueItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        skipped: 0,
    });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load queue and stats
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [queueResult, statsResult] = await Promise.all([
                getVerificationQueue(50, 0),
                getVerificationStats(),
            ]);

            if (queueResult.error) {
                setError(queueResult.error);
            } else {
                setQueue(queueResult.data);
                setTotal(queueResult.total);
                setCurrentIndex(0);
            }

            setStats({
                pending: statsResult.pending,
                approved: statsResult.approved,
                rejected: statsResult.rejected,
                skipped: statsResult.skipped,
            });
        } catch (err) {
            setError('Failed to load verification queue');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const currentEntry = queue[currentIndex];

    // Handle approve
    const handleApprove = async (
        data: { name: string; phone: string; date: string; amount: number | null; status: string | null },
        createMember: boolean
    ) => {
        if (!currentEntry || !user?.email) return;

        setProcessing(true);
        try {
            const result = await approveEntry(
                currentEntry.id,
                {
                    name: data.name,
                    phone: data.phone,
                    date: data.date,
                    amount: data.amount || undefined,
                    status: data.status || undefined,
                },
                user.email,
                createMember
            );

            if (result.success) {
                moveToNext();
                setStats(prev => ({ ...prev, pending: prev.pending - 1, approved: prev.approved + 1 }));
            } else {
                setError(result.error || 'Failed to approve entry');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setProcessing(false);
        }
    };

    // Handle skip
    const handleSkip = async () => {
        if (!currentEntry) return;

        setProcessing(true);
        try {
            const result = await skipEntry(currentEntry.id);
            if (result.success) {
                moveToNext();
                setStats(prev => ({ ...prev, pending: prev.pending - 1, skipped: prev.skipped + 1 }));
            } else {
                setError(result.error || 'Failed to skip entry');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setProcessing(false);
        }
    };

    // Handle reject
    const handleReject = async (reason: string) => {
        if (!currentEntry || !user?.email) return;

        setProcessing(true);
        try {
            const result = await rejectEntry(currentEntry.id, reason, user.email);
            if (result.success) {
                moveToNext();
                setStats(prev => ({ ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }));
            } else {
                setError(result.error || 'Failed to reject entry');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setProcessing(false);
        }
    };

    // Move to next entry
    const moveToNext = () => {
        // Remove current entry from queue
        setQueue(prev => prev.filter((_, i) => i !== currentIndex));
        setTotal(prev => prev - 1);

        // Adjust index if at end
        if (currentIndex >= queue.length - 1 && currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    // Navigate entries
    const handleNavigate = (direction: 'prev' | 'next') => {
        if (direction === 'prev' && currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else if (direction === 'next' && currentIndex < queue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col h-[calc(100vh-64px)]">
                {/* Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                Verification Queue
                            </h1>
                            <p className="text-sm text-gray-500">
                                Review and verify extracted register entries
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                                <span className="text-gray-600">{stats.pending} pending</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-gray-600">{stats.approved} approved</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-red-500 rounded-full" />
                                <span className="text-gray-600">{stats.rejected} rejected</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="px-4 sm:px-6 py-3 bg-red-50 border-b border-red-200">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-red-700">{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Main content */}
                <div className="flex-1 overflow-hidden">
                    {loading ? (
                        /* Loading state */
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin w-10 h-10 border-3 border-gray-200 border-t-black rounded-full mx-auto mb-4" />
                                <p className="text-gray-500">Loading verification queue...</p>
                            </div>
                        </div>
                    ) : queue.length === 0 ? (
                        /* Empty state */
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center max-w-md">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                                <p className="text-gray-500 mb-6">
                                    There are no entries pending verification. Upload more register pages to continue.
                                </p>
                                <a
                                    href="/register/upload"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Upload Register
                                </a>
                            </div>
                        </div>
                    ) : (
                        /* Split panel view */
                        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                            {/* Left: Document viewer */}
                            <div className="h-full p-4 overflow-hidden border-r border-gray-200">
                                <DocumentViewer
                                    imageUrl={currentEntry.storage_url}
                                    highlightBounds={
                                        currentEntry.row_bounds_min_y
                                            ? { minY: currentEntry.row_bounds_min_y, maxY: currentEntry.row_bounds_max_y || 0 }
                                            : undefined
                                    }
                                />
                            </div>

                            {/* Right: Verification form */}
                            <div className="h-full p-4 overflow-auto">
                                <VerificationForm
                                    entry={currentEntry}
                                    position={{ current: currentIndex + 1, total: queue.length }}
                                    onApprove={handleApprove}
                                    onSkip={handleSkip}
                                    onReject={handleReject}
                                    onNavigate={handleNavigate}
                                    isLoading={processing}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

export default function VerificationPage() {
    return (
        <AuthGuard>
            <VerificationContent />
        </AuthGuard>
    );
}
