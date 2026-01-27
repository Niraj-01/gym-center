/**
 * MethodSelector Component
 * 
 * Displays the method selection UI for adding a new member.
 * Users can choose between document scanning (OCR) or manual entry.
 */

import { QuotaDisplay } from '@/components/ocr/QuotaDisplay';

interface MethodSelectorProps {
    /** Callback when a method is selected */
    onSelect: (method: 'scan' | 'manual') => void;
    /** OCR quota information (optional) */
    quotaInfo?: {
        used: number;
        limit: number;
        tier: string;
    } | null;
}

export function MethodSelector({ onSelect, quotaInfo }: MethodSelectorProps) {
    return (
        <div className="space-y-6">
            {/* Quota Display */}
            {quotaInfo && (
                <QuotaDisplay
                    used={quotaInfo.used}
                    limit={quotaInfo.limit}
                    tier={quotaInfo.tier.charAt(0).toUpperCase() + quotaInfo.tier.slice(1)}
                />
            )}

            {/* Method Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Scan Document Option */}
                <button
                    onClick={() => onSelect('scan')}
                    className="group p-6 bg-white border-2 border-gray-200 rounded-xl text-left transition-all hover:border-blue-500 hover:shadow-lg hover:-translate-y-1"
                >
                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                        <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Scan Document</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Upload Aadhaar, PAN, or registration form to auto-extract member details
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        <FeatureItem text="Automatic data extraction" />
                        <FeatureItem text="Fast & accurate" />
                        <FeatureItem text="Supports JPEG, PNG (max 10MB)" />
                    </ul>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium group-hover:bg-blue-700 transition-colors">
                        Upload Document
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </span>
                </button>

                {/* Manual Entry Option */}
                <button
                    onClick={() => onSelect('manual')}
                    className="group p-6 bg-white border-2 border-gray-200 rounded-xl text-left transition-all hover:border-gray-400 hover:shadow-lg hover:-translate-y-1"
                >
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                        <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Manually</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Fill in member details yourself using the registration form
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        <FeatureItem text="Complete control" />
                        <FeatureItem text="No document needed" />
                        <FeatureItem text="Quick for single entries" />
                    </ul>
                    <span className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-medium group-hover:border-gray-400 group-hover:bg-gray-50 transition-colors">
                        Enter Details
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </span>
                </button>
            </div>
        </div>
    );
}

/** Feature list item with checkmark */
function FeatureItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {text}
        </li>
    );
}
