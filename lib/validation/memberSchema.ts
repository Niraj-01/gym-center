/**
 * Member Form Validation Schema
 * 
 * Zod schema for validating member form data.
 * Used in both the Add Member and Edit Member forms.
 */

import { z } from 'zod';

// ============================================
// VALIDATION PATTERNS
// ============================================

// Indian phone number: starts with 6-9, followed by 9 digits
const phonePattern = /^[6-9]\d{9}$/;

// Aadhaar: exactly 12 digits
const aadhaarPattern = /^\d{12}$/;

// PAN: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

// ============================================
// MEMBER SCHEMA
// ============================================

export const memberSchema = z.object({
    // Required fields
    name: z
        .string()
        .min(1, 'Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters'),

    phone: z
        .string()
        .min(1, 'Phone number is required')
        .regex(phonePattern, 'Please enter a valid 10-digit phone number'),

    planId: z
        .string()
        .min(1, 'Please select a membership plan'),

    startDate: z
        .string()
        .min(1, 'Start date is required'),

    // Optional fields
    email: z
        .union([
            z.string().email('Invalid email address'),
            z.literal(''),
        ])
        .optional()
        .transform(val => val || undefined),

    gender: z
        .enum(['Male', 'Female', 'Other', ''])
        .optional()
        .transform(val => val || undefined),

    dateOfBirth: z
        .string()
        .optional()
        .transform(val => val || undefined),

    aadhaar: z
        .union([
            z.string().regex(aadhaarPattern, 'Aadhaar must be 12 digits'),
            z.literal(''),
        ])
        .optional()
        .transform(val => val || undefined),

    pan: z
        .union([
            z.string().regex(panPattern, 'Invalid PAN format (e.g., ABCDE1234F)'),
            z.literal(''),
        ])
        .optional()
        .transform(val => val?.toUpperCase() || undefined),

    address: z
        .string()
        .max(500, 'Address must be less than 500 characters')
        .optional()
        .transform(val => val || undefined),

    notes: z
        .string()
        .max(1000, 'Notes must be less than 1000 characters')
        .optional()
        .transform(val => val || undefined),
});

// ============================================
// TYPES
// ============================================

/** Raw form data before validation */
export type MemberFormInput = z.input<typeof memberSchema>;

/** Validated and transformed form data */
export type MemberFormData = z.output<typeof memberSchema>;

/** Validation result type */
export type ValidationResult =
    | { success: true; data: MemberFormData }
    | { success: false; errors: Record<string, string> };

// ============================================
// VALIDATION FUNCTION
// ============================================

/**
 * Validate member form data
 * Returns either validated data or a record of field errors
 */
export function validateMemberForm(input: MemberFormInput): ValidationResult {
    const result = memberSchema.safeParse(input);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Transform Zod errors into a simple field -> message map
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) {
            errors[field] = issue.message;
        }
    }

    return { success: false, errors };
}

/**
 * Get all validation errors as an array of strings
 */
export function getValidationErrors(input: MemberFormInput): string[] {
    const result = memberSchema.safeParse(input);

    if (result.success) {
        return [];
    }

    return result.error.issues.map(issue => issue.message);
}

// ============================================
// FIELD-LEVEL HELPERS
// ============================================

/**
 * Format phone number for display (add +91 prefix)
 */
export function formatPhoneForSave(phone: string): string {
    const clean = phone.replace(/\D/g, '').slice(0, 10);
    return clean ? `+91 ${clean}` : '';
}

/**
 * Clean phone number for form (remove +91 prefix)
 */
export function cleanPhoneForForm(phone: string | null | undefined): string {
    if (!phone) return '';
    return phone.replace(/^\+91\s?/, '').replace(/\D/g, '');
}

/**
 * Format Aadhaar for display (XXXX XXXX XXXX)
 */
export function formatAadhaarDisplay(aadhaar: string | null | undefined): string {
    if (!aadhaar) return '';
    const clean = aadhaar.replace(/\D/g, '');
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
