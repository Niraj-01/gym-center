'use client';

import { getConfidenceBadgeClass, formatConfidence } from '@/lib/utils/ocrUtils';

interface ResultsFormProps {
    formData: {
        name: string;
        phone: string;
        email: string;
        gender: string;
        planId: string;
        startDate: string;
    };
    confidence?: {
        name: number;
        phone: number;
        email: number;
        gender: number;
        dateOfBirth: number;
        address: number;
        aadhaar: number;
        pan: number;
    };
    plans: Array<{ id: number; name: string; duration_days: number; price: number }>;
    expiryDate: string;
    onFieldChange: (field: string, value: string) => void;
    onSave: () => void;
    onCancel: () => void;
    saving: boolean;
}

export function ResultsForm({
    formData,
    confidence,
    plans,
    expiryDate,
    onFieldChange,
    onSave,
    onCancel,
    saving,
}: ResultsFormProps) {
    const renderConfidenceBadge = (field: keyof NonNullable<typeof confidence>) => {
        if (!confidence || !confidence[field]) return null;

        const score = confidence[field];
        return (
            <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getConfidenceBadgeClass(score)}`}>
                {formatConfidence(score)}
            </span>
        );
    };

    return (
        <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                Extracted Data
                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                    Edit as needed
                </span>
            </h3>

            <div className="space-y-4">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                        Full Name {renderConfidenceBadge('name')}
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => onFieldChange('name', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="Enter full name"
                    />
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                        Phone Number {renderConfidenceBadge('phone')}
                    </label>
                    <div className="flex">
                        <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 text-sm">
                            +91
                        </span>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => onFieldChange('phone', e.target.value.replace(/\D/g, ''))}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-xl focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="9876543210"
                            maxLength={10}
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                        Email {renderConfidenceBadge('email')}
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => onFieldChange('email', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="email@example.com"
                    />
                </div>

                {/* Gender */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                        Gender {renderConfidenceBadge('gender')}
                    </label>
                    <select
                        value={formData.gender}
                        onChange={(e) => onFieldChange('gender', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                    >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {/* Plan Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                        Membership Plan
                    </label>
                    <select
                        value={formData.planId}
                        onChange={(e) => onFieldChange('planId', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                    >
                        {plans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                                {plan.name} - ₹{plan.price} ({plan.duration_days} days)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Start Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => onFieldChange('startDate', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                </div>

                {/* Expiry Date (calculated) */}
                {expiryDate && (
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Expiry Date
                        </label>
                        <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
                            {new Date(expiryDate).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onSave}
                        disabled={saving || !formData.name || !formData.phone}
                        className="flex-1 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save Member
                            </>
                        )}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={saving}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
