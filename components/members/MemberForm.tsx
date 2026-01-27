/**
 * MemberForm Component
 * 
 * Complete member form for adding/editing members.
 * Handles form state, validation, and displays with confidence indicators.
 * Does NOT handle database mutations - that's the parent's responsibility.
 */

import { useState, useMemo } from 'react';
import {
    FormInput,
    FormSelect,
    FormTextarea,
    DocumentPreview,
    getConfidenceStyle,
} from './MemberFormFields';
import { validateMemberForm, type MemberFormInput } from '@/lib/validation/memberSchema';
import { formatDate, calculateExpiryDate } from '@/lib/utils/date';

// ============================================
// TYPES
// ============================================

export interface Plan {
    id: number;
    name: string;
    duration_days: number;
    price: number;
}

export interface FieldConfidence {
    name?: number;
    phone?: number;
    email?: number;
    gender?: number;
    aadhaar?: number;
    pan?: number;
    address?: number;
    dateOfBirth?: number;
}

export interface MemberFormProps {
    /** Initial form values */
    initialValues?: Partial<MemberFormInput>;
    /** Available membership plans */
    plans: Plan[];
    /** Confidence scores for OCR-extracted fields */
    confidence?: FieldConfidence;
    /** Whether to show confidence indicators (for OCR mode) */
    showConfidence?: boolean;
    /** Overall OCR confidence score */
    overallConfidence?: number;
    /** Document preview URL (for OCR mode) */
    previewUrl?: string | null;
    /** Whether save is in progress */
    saving?: boolean;
    /** Error message to display */
    error?: string | null;
    /** Callback when form is submitted with validated data */
    onSave: (data: MemberFormInput, expiryDate: string) => void;
    /** Callback to cancel/go back */
    onCancel: () => void;
    /** Callback to upload a different document (OCR mode) */
    onUploadDifferent?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function MemberForm({
    initialValues = {},
    plans,
    confidence = {},
    showConfidence = false,
    overallConfidence,
    previewUrl,
    saving = false,
    error,
    onSave,
    onCancel,
    onUploadDifferent,
}: MemberFormProps) {
    // Form state
    const [formData, setFormData] = useState<MemberFormInput>({
        name: initialValues.name || '',
        phone: initialValues.phone || '',
        email: initialValues.email || '',
        gender: initialValues.gender || '',
        planId: initialValues.planId || (plans[0]?.id ? String(plans[0].id) : ''),
        startDate: initialValues.startDate || new Date().toISOString().split('T')[0],
        aadhaar: initialValues.aadhaar || '',
        pan: initialValues.pan || '',
        address: initialValues.address || '',
        dateOfBirth: initialValues.dateOfBirth || '',
        notes: initialValues.notes || '',
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Calculate expiry date based on selected plan
    const expiryDate = useMemo(() => {
        const selectedPlan = plans.find(p => p.id === Number(formData.planId));
        if (!selectedPlan || !formData.startDate) return '';
        return calculateExpiryDate(formData.startDate, selectedPlan.duration_days);
    }, [formData.planId, formData.startDate, plans]);

    // Update a single field
    const handleFieldChange = (field: keyof MemberFormInput, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear field error when user types
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    // Handle form submission
    const handleSubmit = () => {
        const result = validateMemberForm(formData);

        if (!result.success) {
            setFieldErrors(result.errors);
            return;
        }

        if (!expiryDate) {
            setFieldErrors({ planId: 'Please select a valid plan' });
            return;
        }

        onSave(formData, expiryDate);
    };

    // Plan options for select
    const planOptions = plans.map(plan => ({
        value: String(plan.id),
        label: `${plan.name} - ₹${plan.price} (${plan.duration_days} days)`,
    }));

    // Gender options
    const genderOptions = [
        { value: '', label: 'Select gender' },
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
        { value: 'Other', label: 'Other' },
    ];

    // Show error summary
    const errorMessage = error || (Object.keys(fieldErrors).length > 0 ? Object.values(fieldErrors).join('. ') : null);

    // Main form content
    const formContent = (
        <div className="bg-white border border-gray-200 rounded-xl">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Member Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                    {showConfidence ? 'Review and edit extracted information' : 'Fill in the member information'}
                </p>
            </div>

            <div className="p-4 space-y-4">
                {/* Error Alert */}
                {errorMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-700">{errorMessage}</p>
                        </div>
                    </div>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="md:col-span-2">
                        <FormInput
                            label="Full Name"
                            required
                            value={formData.name}
                            onChange={(v) => handleFieldChange('name', v)}
                            placeholder="Enter full name"
                            confidence={confidence.name}
                            showConfidence={showConfidence}
                        />
                    </div>

                    {/* Phone */}
                    <FormInput
                        label="Phone Number"
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(v) => handleFieldChange('phone', v.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        maxLength={10}
                        prefix="+91"
                        confidence={confidence.phone}
                        showConfidence={showConfidence}
                    />

                    {/* Email */}
                    <FormInput
                        label="Email (Optional)"
                        type="email"
                        value={formData.email || ''}
                        onChange={(v) => handleFieldChange('email', v)}
                        placeholder="member@example.com"
                    />

                    {/* Gender */}
                    <FormSelect
                        label="Gender"
                        value={formData.gender || ''}
                        onChange={(v) => handleFieldChange('gender', v)}
                        options={genderOptions}
                        confidence={confidence.gender}
                        showConfidence={showConfidence}
                    />

                    {/* Date of Birth */}
                    <FormInput
                        label="Date of Birth"
                        type="date"
                        value={formData.dateOfBirth || ''}
                        onChange={(v) => handleFieldChange('dateOfBirth', v)}
                    />
                </div>

                {/* ID Information */}
                <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">ID Information (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Aadhaar */}
                        <FormInput
                            label="Aadhaar Number"
                            value={formData.aadhaar || ''}
                            onChange={(v) => handleFieldChange('aadhaar', v.replace(/\D/g, '').slice(0, 12))}
                            placeholder="XXXX XXXX XXXX"
                            maxLength={12}
                            mono
                            confidence={confidence.aadhaar}
                            showConfidence={showConfidence}
                        />

                        {/* PAN */}
                        <FormInput
                            label="PAN Number"
                            value={formData.pan || ''}
                            onChange={(v) => handleFieldChange('pan', v.slice(0, 10))}
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            mono
                            uppercase
                            confidence={confidence.pan}
                            showConfidence={showConfidence}
                        />

                        {/* Address */}
                        <div className="md:col-span-2">
                            <FormTextarea
                                label="Address"
                                value={formData.address || ''}
                                onChange={(v) => handleFieldChange('address', v)}
                                placeholder="Enter address"
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

                {/* Membership Details */}
                <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Membership Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Plan */}
                        <FormSelect
                            label="Membership Plan"
                            required
                            value={formData.planId}
                            onChange={(v) => handleFieldChange('planId', v)}
                            options={planOptions}
                        />

                        {/* Start Date */}
                        <FormInput
                            label="Start Date"
                            required
                            type="date"
                            value={formData.startDate}
                            onChange={(v) => handleFieldChange('startDate', v)}
                        />

                        {/* Expiry Preview */}
                        {formData.planId && expiryDate && (
                            <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    Membership will expire on:{' '}
                                    <span className="font-semibold text-gray-900">
                                        {formatDate(expiryDate, 'long')}
                                    </span>
                                </p>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="md:col-span-2">
                            <FormTextarea
                                label="Notes (Optional)"
                                value={formData.notes || ''}
                                onChange={(v) => handleFieldChange('notes', v)}
                                placeholder="Any additional notes..."
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                        onClick={handleSubmit}
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

    // Layout: Side-by-side with preview for OCR mode
    if (showConfidence && previewUrl && onUploadDifferent) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2">
                    <DocumentPreview
                        previewUrl={previewUrl}
                        overallConfidence={overallConfidence}
                        onUploadDifferent={onUploadDifferent}
                    />
                </div>
                <div className="lg:col-span-3">
                    {formContent}
                </div>
            </div>
        );
    }

    // Standard full-width layout
    return formContent;
}
