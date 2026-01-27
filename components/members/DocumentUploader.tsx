/**
 * DocumentUploader Component
 * 
 * Handles file upload UI with drag-and-drop support.
 * Validates file type and size before accepting.
 */

import { useState, useCallback } from 'react';
import { QuotaDisplay } from '@/components/ocr/QuotaDisplay';

interface DocumentUploaderProps {
    /** Callback when a valid file is selected */
    onFileSelect: (file: File) => void;
    /** Callback to go back to method selection */
    onBack: () => void;
    /** Whether OCR processing is in progress */
    isProcessing?: boolean;
    /** OCR quota information */
    quotaInfo?: {
        used: number;
        limit: number;
        tier: string;
    } | null;
    /** Error message to display */
    error?: string | null;
}

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function DocumentUploader({
    onFileSelect,
    onBack,
    isProcessing = false,
    quotaInfo,
    error,
}: DocumentUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const validateAndSelect = useCallback((file: File) => {
        setLocalError(null);

        if (!VALID_TYPES.includes(file.type)) {
            setLocalError('Please upload a JPEG or PNG image');
            return;
        }

        if (file.size > MAX_SIZE_BYTES) {
            setLocalError(`File size must be less than ${MAX_SIZE_MB}MB`);
            return;
        }

        onFileSelect(file);
    }, [onFileSelect]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) validateAndSelect(file);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) validateAndSelect(file);
        e.target.value = '';
    };

    const displayError = error || localError;

    return (
        <div className="space-y-6">
            {quotaInfo && (
                <QuotaDisplay
                    used={quotaInfo.used}
                    limit={quotaInfo.limit}
                    tier={quotaInfo.tier.charAt(0).toUpperCase() + quotaInfo.tier.slice(1)}
                />
            )}

            {/* Error Alert */}
            {displayError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-700">{displayError}</p>
                    </div>
                </div>
            )}

            {/* Upload Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
                className={`
                    relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                        : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                    }
                    ${isProcessing ? 'pointer-events-none opacity-50' : ''}
                `}
            >
                <input
                    type="file"
                    id="file-input"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={isProcessing}
                />

                <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${isDragging ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isDragging ? 'Drop your document' : 'Upload ID Document'}
                </h3>
                <p className="text-gray-500 mb-6">
                    Drag and drop or click to select an Aadhaar card, PAN card, or registration form
                </p>

                <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Select Document
                </div>

                <p className="mt-4 text-xs text-gray-400">
                    Supports: JPEG, PNG • Max size: {MAX_SIZE_MB}MB
                </p>
            </div>

            {/* Document Type Examples */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { icon: '🪪', label: 'Aadhaar Card', desc: 'Auto-extract name, DOB, address' },
                    { icon: '💳', label: 'PAN Card', desc: 'Auto-extract name, PAN number' },
                    { icon: '📋', label: 'Registration Form', desc: 'Auto-extract all fields' },
                ].map((docType) => (
                    <div key={docType.label} className="p-4 bg-gray-50 rounded-lg text-center">
                        <span className="text-2xl">{docType.icon}</span>
                        <p className="text-sm font-medium text-gray-900 mt-2">{docType.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{docType.desc}</p>
                    </div>
                ))}
            </div>

            {/* Back Button */}
            <div className="text-center">
                <button
                    onClick={onBack}
                    disabled={isProcessing}
                    className="text-sm text-gray-600 hover:text-gray-900 transition disabled:opacity-50"
                >
                    ← Back to method selection
                </button>
            </div>
        </div>
    );
}
