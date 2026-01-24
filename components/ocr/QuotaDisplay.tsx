'use client';

interface QuotaDisplayProps {
    used: number;
    limit: number;
    tier: string;
}

export function QuotaDisplay({ used, limit, tier }: QuotaDisplayProps) {
    const remaining = Math.max(0, limit - used);

    return (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 mb-6">
            <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">OCR Scans</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                    {tier}
                </span>
            </div>
            <span className="text-sm text-gray-600">
                {remaining} of {limit} remaining
            </span>
        </div>
    );
}
