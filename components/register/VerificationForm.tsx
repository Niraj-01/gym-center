'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VerificationQueueItem } from '@/app/actions/register';

interface VerificationFormProps {
    entry: VerificationQueueItem;
    position: { current: number; total: number };
    onApprove: (data: ApproveData, createMember: boolean) => void;
    onSkip: () => void;
    onReject: (reason: string) => void;
    onNavigate: (direction: 'prev' | 'next') => void;
    isLoading: boolean;
}

interface ApproveData {
    name: string;
    phone: string;
    date: string;
    amount: number | null;
    status: string | null;
}

const CONFIDENCE_THRESHOLD = 0.85;

export function VerificationForm({
    entry,
    position,
    onApprove,
    onSkip,
    onReject,
    onNavigate,
    isLoading,
}: VerificationFormProps) {
    const [formData, setFormData] = useState<ApproveData>({
        name: entry.name || '',
        phone: entry.phone || '',
        date: entry.entry_date || '',
        amount: entry.amount,
        status: entry.payment_status,
    });
    const [createMember, setCreateMember] = useState(true);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const nameInputRef = useRef<HTMLInputElement>(null);

    // Update form when entry changes
    useEffect(() => {
        setFormData({
            name: entry.name || '',
            phone: entry.phone || '',
            date: entry.entry_date || '',
            amount: entry.amount,
            status: entry.payment_status,
        });
        setShowRejectDialog(false);
        setRejectReason('');

        // Focus first low-confidence field or name
        setTimeout(() => {
            if (entry.low_confidence_fields?.includes('name')) {
                nameInputRef.current?.focus();
                nameInputRef.current?.select();
            }
        }, 100);
    }, [entry]);

    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (showRejectDialog) return;

        // Enter to approve
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            if (formData.name && formData.phone) {
                onApprove(formData, createMember);
            }
        }

        // Escape to skip
        if (e.key === 'Escape') {
            e.preventDefault();
            onSkip();
        }

        // Arrow keys to navigate (when not in input)
        if (e.target === document.body) {
            if (e.key === 'ArrowLeft') onNavigate('prev');
            if (e.key === 'ArrowRight') onNavigate('next');
        }
    }, [formData, createMember, onApprove, onSkip, onNavigate, showRejectDialog]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleChange = (field: keyof ApproveData, value: string | number | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const isLowConfidence = (field: string) => {
        const confidenceMap: Record<string, number> = {
            name: entry.name_confidence,
            phone: entry.phone_confidence,
            date: entry.date_confidence,
            amount: entry.amount_confidence,
            status: entry.status_confidence,
        };
        return (confidenceMap[field] || 0) < CONFIDENCE_THRESHOLD;
    };

    const getConfidenceBadge = (confidence: number) => {
        const percent = Math.round(confidence * 100);
        const isLow = confidence < CONFIDENCE_THRESHOLD;

        return (
            <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded ${isLow ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}
            >
                {percent}%
            </span>
        );
    };

    const canApprove = formData.name.trim() && formData.phone.trim();

    return (
        <div className="bg-white border border-gray-200 rounded-xl h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-gray-900">Verify Entry</h3>
                    <span className="text-xs text-gray-500">
                        {position.current} of {position.total}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onNavigate('prev')}
                        disabled={position.current <= 1 || isLoading}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onNavigate('next')}
                        disabled={position.current >= position.total || isLoading}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Form fields */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Overall confidence */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Overall Confidence</span>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all ${entry.overall_confidence >= CONFIDENCE_THRESHOLD ? 'bg-green-500' : 'bg-yellow-500'
                                    }`}
                                style={{ width: `${entry.overall_confidence * 100}%` }}
                            />
                        </div>
                        {getConfidenceBadge(entry.overall_confidence)}
                    </div>
                </div>

                {/* Name */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-gray-700">Name *</label>
                        {getConfidenceBadge(entry.name_confidence)}
                    </div>
                    <input
                        ref={nameInputRef}
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border-2 rounded-lg transition outline-none ${isLowConfidence('name')
                                ? 'border-yellow-300 bg-yellow-50 focus:border-yellow-500'
                                : 'border-gray-200 focus:border-black'
                            }`}
                        placeholder="Enter name"
                    />
                </div>

                {/* Phone */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-gray-700">Phone *</label>
                        {getConfidenceBadge(entry.phone_confidence)}
                    </div>
                    <div className="flex gap-2">
                        <span className="flex items-center px-3 bg-gray-100 border-2 border-gray-200 rounded-lg text-gray-600 text-sm">
                            +91
                        </span>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            className={`flex-1 px-3 py-2 border-2 rounded-lg transition outline-none ${isLowConfidence('phone')
                                    ? 'border-yellow-300 bg-yellow-50 focus:border-yellow-500'
                                    : 'border-gray-200 focus:border-black'
                                }`}
                            placeholder="9876543210"
                            maxLength={10}
                        />
                    </div>
                </div>

                {/* Date */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-gray-700">Date</label>
                        {getConfidenceBadge(entry.date_confidence)}
                    </div>
                    <input
                        type="date"
                        value={formData.date || ''}
                        onChange={(e) => handleChange('date', e.target.value)}
                        className={`w-full px-3 py-2 border-2 rounded-lg transition outline-none ${isLowConfidence('date')
                                ? 'border-yellow-300 bg-yellow-50 focus:border-yellow-500'
                                : 'border-gray-200 focus:border-black'
                            }`}
                    />
                </div>

                {/* Amount */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-gray-700">Amount</label>
                        {getConfidenceBadge(entry.amount_confidence)}
                    </div>
                    <div className="flex gap-2">
                        <span className="flex items-center px-3 bg-gray-100 border-2 border-gray-200 rounded-lg text-gray-600 text-sm">
                            ₹
                        </span>
                        <input
                            type="number"
                            value={formData.amount ?? ''}
                            onChange={(e) => handleChange('amount', e.target.value ? parseFloat(e.target.value) : null)}
                            className={`flex-1 px-3 py-2 border-2 rounded-lg transition outline-none ${isLowConfidence('amount')
                                    ? 'border-yellow-300 bg-yellow-50 focus:border-yellow-500'
                                    : 'border-gray-200 focus:border-black'
                                }`}
                            placeholder="0"
                            min={0}
                        />
                    </div>
                </div>

                {/* Status */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-gray-700">Payment Status</label>
                        {entry.status_confidence > 0 && getConfidenceBadge(entry.status_confidence)}
                    </div>
                    <select
                        value={formData.status || ''}
                        onChange={(e) => handleChange('status', e.target.value || null)}
                        className={`w-full px-3 py-2 border-2 rounded-lg transition outline-none cursor-pointer ${isLowConfidence('status') && entry.status_confidence > 0
                                ? 'border-yellow-300 bg-yellow-50 focus:border-yellow-500'
                                : 'border-gray-200 focus:border-black'
                            }`}
                    >
                        <option value="">Not specified</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                    </select>
                </div>

                {/* Create member checkbox */}
                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                        type="checkbox"
                        checked={createMember}
                        onChange={(e) => setCreateMember(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-sm text-gray-700">Create member record on approve</span>
                </label>
            </div>

            {/* Reject dialog */}
            {showRejectDialog && (
                <div className="p-4 border-t border-gray-200 bg-red-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection reason
                    </label>
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-red-300 rounded-lg resize-none focus:border-red-500 outline-none"
                        rows={2}
                        placeholder="Enter reason..."
                        autoFocus
                    />
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => {
                                if (rejectReason.trim()) {
                                    onReject(rejectReason);
                                }
                            }}
                            disabled={!rejectReason.trim()}
                            className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition"
                        >
                            Confirm Reject
                        </button>
                        <button
                            onClick={() => setShowRejectDialog(false)}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Action buttons */}
            {!showRejectDialog && (
                <div className="p-4 border-t border-gray-200 space-y-3">
                    <button
                        onClick={() => onApprove(formData, createMember)}
                        disabled={!canApprove || isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Approve Entry
                            </>
                        )}
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={onSkip}
                            disabled={isLoading}
                            className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition"
                        >
                            Skip
                        </button>
                        <button
                            onClick={() => setShowRejectDialog(true)}
                            disabled={isLoading}
                            className="flex-1 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50 transition"
                        >
                            Reject
                        </button>
                    </div>

                    {/* Keyboard hints */}
                    <div className="text-xs text-center text-gray-400">
                        <span className="inline-flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">⌘/Ctrl + Enter</kbd>
                            <span>Approve</span>
                        </span>
                        <span className="mx-2">·</span>
                        <span className="inline-flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">Esc</kbd>
                            <span>Skip</span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
