/**
 * MemberFormFields Component
 * 
 * Reusable form field components for member forms.
 * Includes confidence score styling for OCR-extracted fields.
 */

import { ConfidenceBadge } from '@/components/ocr/ConfidenceBadge';

// ============================================
// TYPES
// ============================================

interface ConfidenceStyle {
    bg: string;
    border: string;
}

interface BaseFieldProps {
    label: string;
    required?: boolean;
    confidence?: number;
    showConfidence?: boolean;
}

interface InputFieldProps extends BaseFieldProps {
    type?: 'text' | 'email' | 'tel' | 'date';
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    className?: string;
    prefix?: string;
    mono?: boolean;
    uppercase?: boolean;
}

interface SelectFieldProps extends BaseFieldProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}

interface TextareaFieldProps extends BaseFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}

// ============================================
// HELPERS
// ============================================

/**
 * Get confidence-based styling for form fields
 */
export function getConfidenceStyle(confidence: number): ConfidenceStyle {
    if (confidence >= 0.85) return { bg: 'bg-green-50', border: 'border-green-200' };
    if (confidence >= 0.6) return { bg: 'bg-yellow-50', border: 'border-yellow-300' };
    return { bg: 'bg-white', border: 'border-gray-200' };
}

/**
 * Small confidence indicator badge
 */
function ConfidenceIndicator({ score }: { score: number }) {
    const percent = Math.round(score * 100);
    const isLow = score < 0.85;

    return (
        <span className={`text-xs px-1.5 py-0.5 font-medium rounded ${isLow ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
            {percent}%
        </span>
    );
}

// ============================================
// FORM FIELD COMPONENTS
// ============================================

/**
 * Text/Email/Tel/Date input field with optional confidence styling
 */
export function FormInput({
    label,
    required,
    type = 'text',
    value,
    onChange,
    placeholder,
    maxLength,
    confidence,
    showConfidence = false,
    prefix,
    mono = false,
    uppercase = false,
}: InputFieldProps) {
    const style = showConfidence && confidence ? getConfidenceStyle(confidence) : { bg: 'bg-white', border: 'border-gray-200' };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value;
        if (uppercase) newValue = newValue.toUpperCase();
        onChange(newValue);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">
                    {label} {required && '*'}
                </label>
                {showConfidence && confidence !== undefined && confidence > 0 && (
                    <ConfidenceIndicator score={confidence} />
                )}
            </div>
            <div className={prefix ? 'flex gap-2' : ''}>
                {prefix && (
                    <span className="flex items-center px-3 bg-gray-100 border-2 border-gray-200 rounded-lg text-gray-600 text-sm">
                        {prefix}
                    </span>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className={`
                        ${prefix ? 'flex-1' : 'w-full'} px-4 py-3 border-2 rounded-lg transition outline-none focus:border-black
                        text-gray-900 placeholder-gray-500
                        ${style.bg} ${style.border}
                        ${mono ? 'font-mono' : ''}
                        ${uppercase ? 'uppercase' : ''}
                    `}
                />
            </div>
        </div>
    );
}

/**
 * Select dropdown field
 */
export function FormSelect({
    label,
    required,
    value,
    onChange,
    options,
    confidence,
    showConfidence = false,
}: SelectFieldProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">
                    {label} {required && '*'}
                </label>
                {showConfidence && confidence !== undefined && confidence > 0 && (
                    <ConfidenceIndicator score={confidence} />
                )}
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition outline-none cursor-pointer focus:border-black text-gray-900 bg-white"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

/**
 * Textarea field
 */
export function FormTextarea({
    label,
    required,
    value,
    onChange,
    placeholder,
    rows = 2,
}: TextareaFieldProps) {
    return (
        <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {label} {required && '*'}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition outline-none resize-none focus:border-black text-gray-900 placeholder-gray-500"
            />
        </div>
    );
}

// ============================================
// DOCUMENT PREVIEW
// ============================================

interface DocumentPreviewProps {
    previewUrl: string;
    overallConfidence?: number;
    onUploadDifferent: () => void;
}

export function DocumentPreview({ previewUrl, overallConfidence, onUploadDifferent }: DocumentPreviewProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-4">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Scanned Document</span>
                {overallConfidence !== undefined && (
                    <ConfidenceBadge score={Math.round(overallConfidence * 100)} />
                )}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Scanned document" className="w-full h-auto" />
            <div className="p-4 bg-gray-50 border-t border-gray-200">
                <button
                    onClick={onUploadDifferent}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 4v6h6M23 20v-6h-6" />
                        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                    </svg>
                    Upload Different Document
                </button>
            </div>
        </div>
    );
}
