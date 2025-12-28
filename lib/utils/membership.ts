/**
 * Membership Calculation Utilities
 * Handles days remaining, status determination, and expiry calculations
 */

export interface MembershipStatus {
    status: 'Active' | 'Expiring Soon' | 'Urgent Renewal' | 'Expired';
    bgColor: string;
    textColor: string;
    borderColor: string;
    daysRemaining: number;
}

/**
 * Calculate days remaining until membership expiry
 * @param expiryDate Membership expiry date
 * @returns Number of days remaining (negative if expired)
 */
export function calculateDaysRemaining(expiryDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day

    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0); // Reset to start of day

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Get membership status based on days remaining
 * @param daysRemaining Number of days until expiry
 * @returns Status object with colors and status text
 */
export function getMembershipStatus(daysRemaining: number): MembershipStatus {
    if (daysRemaining > 15) {
        return {
            status: 'Active',
            bgColor: 'bg-green-50',
            textColor: 'text-green-900',
            borderColor: 'border-green-200',
            daysRemaining
        };
    } else if (daysRemaining >= 5 && daysRemaining <= 15) {
        return {
            status: 'Expiring Soon',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-900',
            borderColor: 'border-yellow-200',
            daysRemaining
        };
    } else if (daysRemaining >= 1 && daysRemaining < 5) {
        return {
            status: 'Urgent Renewal',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-900',
            borderColor: 'border-orange-200',
            daysRemaining
        };
    } else {
        return {
            status: 'Expired',
            bgColor: 'bg-red-50',
            textColor: 'text-red-900',
            borderColor: 'border-red-200',
            daysRemaining
        };
    }
}

/**
 * Calculate new expiry date based on current expiry and plan duration
 * If membership is already expired, calculate from today
 * @param currentExpiry Current membership expiry date
 * @param durationDays Plan duration in days
 * @returns New expiry date
 */
export function calculateNewExpiry(currentExpiry: Date, durationDays: number): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(currentExpiry);
    expiry.setHours(0, 0, 0, 0);

    // If membership is expired, calculate from today
    // Otherwise, extend from current expiry
    const baseDate = expiry < today ? today : expiry;

    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + durationDays);

    return newExpiry;
}

/**
 * Check if member should see renewal button
 * @param daysRemaining Number of days until expiry
 * @returns true if renewal button should be shown (≤7 days)
 */
export function shouldShowRenewalButton(daysRemaining: number): boolean {
    return daysRemaining <= 7;
}

/**
 * Format date for display
 * @param date Date to format
 * @returns Formatted date string (e.g., "25 Dec 2025")
 */
export function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Format date range for display
 * @param startDate Start date
 * @param endDate End date
 * @returns Formatted date range (e.g., "1 Jan - 31 Jan 2025")
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();

    if (sameMonth) {
        return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
    } else if (sameYear) {
        return `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${formatDate(end)}`;
    } else {
        return `${formatDate(start)} - ${formatDate(end)} `;
    }
}
