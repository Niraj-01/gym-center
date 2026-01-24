'use client';

import { ConfidenceBadge } from './ConfidenceBadge';

interface ExtractedDataFormProps {
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

export function ExtractedDataForm({
    formData,
    confidence,
    plans,
    expiryDate,
    onFieldChange,
    onSave,
    onCancel,
    saving,
}: ExtractedDataFormProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-gray-900">Extracted Data</h3>
                <span className="text-xs font-medium text-green-600">Edit as needed</span>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
                {/* Full Name */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        {confidence?.name ? <ConfidenceBadge score={Math.round(confidence.name * 100)} /> : null}
                    </div>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => onFieldChange('name', e.target.value)}
                        className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition placeholder:text-gray-400"
                        placeholder="Enter full name"
                    />
                </div>

                {/* Phone Number */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                        {confidence?.phone ? <ConfidenceBadge score={Math.round(confidence.phone * 100)} /> : null}
                    </div>
                    <div className="flex gap-2">
                        <div className="flex items-center justify-center px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg text-gray-700 font-medium">
                            +91
                        </div>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => onFieldChange('phone', e.target.value.replace(/\D/g, ''))}
                            className="flex-1 px-4 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition placeholder:text-gray-400"
                            placeholder="9876543210"
                            maxLength={10}
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        {confidence?.email ? <ConfidenceBadge score={Math.round(confidence.email * 100)} /> : null}
                    </div>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => onFieldChange('email', e.target.value)}
                        className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition placeholder:text-gray-400"
                        placeholder="email@example.com"
                    />
                </div>

                {/* Gender */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Gender</label>
                        {confidence?.gender ? <ConfidenceBadge score={Math.round(confidence.gender * 100)} /> : null}
                    </div>
                    <input
                        type="text"
                        value={formData.gender}
                        onChange={(e) => onFieldChange('gender', e.target.value)}
                        className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition placeholder:text-gray-400"
                        placeholder="Male / Female"
                    />
                </div>

                {/* Membership Plan */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Membership Plan
                    </label>
                    <select
                        value={formData.planId}
                        onChange={(e) => onFieldChange('planId', e.target.value)}
                        className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-2 focus:ring-black/5 outline-none cursor-pointer"
                    >
                        <option value="">Select membership plan</option>
                        {plans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                                {plan.name} - ₹{plan.price.toLocaleString('en-IN')} ({plan.duration_days} days)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Start Date */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => onFieldChange('startDate', e.target.value)}
                        className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition"
                    />
                </div>

                {/* Expiry Date (calculated, read-only) */}
                {expiryDate && (
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Expiry Date
                        </label>
                        <div className="px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg text-gray-700">
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
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onSave}
                        disabled={saving || !formData.name || !formData.phone}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 13l4 4L19 7" />
                                </svg>
                                Save Member
                            </>
                        )}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={saving}
                        className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
