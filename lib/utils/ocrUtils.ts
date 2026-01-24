/**
 * OCR Utilities
 * Helper functions for OCR processing
 */

// Maximum file size (10MB)
export const MAX_FILE_SIZE = parseInt(process.env.OCR_MAX_FILE_SIZE || '10485760');

// Supported file types
export const SUPPORTED_FORMATS = (
    process.env.OCR_SUPPORTED_FORMATS || 'image/jpeg,image/png,image/jpg'
).split(',');

/**
 * Validate uploaded file
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
        };
    }

    // Check file type
    if (!SUPPORTED_FORMATS.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Only JPEG and PNG images are supported',
        };
    }

    return { valid: true };
}

/**
 * Convert File to Buffer
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonthYear(): string {
    return new Date().toISOString().slice(0, 7);
}

/**
 * Format confidence score as percentage
 */
export function formatConfidence(score: number): string {
    return `${Math.round(score * 100)}%`;
}

/**
 * Get confidence level label
 */
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
}

/**
 * Get confidence badge color classes
 */
export function getConfidenceBadgeClass(score: number): string {
    const level = getConfidenceLevel(score);
    switch (level) {
        case 'high':
            return 'bg-green-100 text-green-800';
        case 'medium':
            return 'bg-yellow-100 text-yellow-800';
        case 'low':
            return 'bg-red-100 text-red-800';
    }
}
