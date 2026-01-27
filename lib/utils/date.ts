/**
 * Date Utilities
 * 
 * Shared date formatting and calculation functions used across the application.
 * All functions handle both string and Date inputs for flexibility.
 */

// ============================================
// DATABASE FORMATTING (for Supabase)
// ============================================

/**
 * Format date for database storage (YYYY-MM-DD format)
 */
export function formatDateForDB(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
        console.error('❌ Invalid date:', date);
        throw new Error(`Invalid date: ${date}`);
    }

    return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Parse database date string into Date object
 */
export function parseDBDate(dateStr: string | null | undefined): Date {
    if (!dateStr) {
        return new Date();
    }

    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
        console.error('❌ Failed to parse date:', dateStr);
        return new Date();
    }

    return date;
}

/**
 * Calculate expiry date from start date and duration
 */
export function calculateExpiryDate(startDate: Date | string, durationDays: number): string {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const expiry = new Date(start);
    expiry.setDate(expiry.getDate() + durationDays);
    return formatDateForDB(expiry);
}

// ============================================
// DISPLAY FORMATTING (for UI)
// ============================================

type DateFormat = 'short' | 'long' | 'full';

/**
 * Format date for display in UI
 * 
 * @param date - Date string or Date object
 * @param format - 'short' (27 Jan), 'long' (27 January 2026), 'full' (Monday, 27 January 2026)
 * @returns Formatted date string
 * 
 * @example
 * formatDate('2026-01-27', 'short') // "27 Jan"
 * formatDate('2026-01-27', 'long')  // "27 January 2026"
 */
export function formatDate(date: string | Date, format: DateFormat = 'long'): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
        return 'Invalid date';
    }

    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: format === 'short' ? 'short' : 'long',
    };

    if (format === 'long' || format === 'full') {
        options.year = 'numeric';
    }

    if (format === 'full') {
        options.weekday = 'long';
    }

    return d.toLocaleDateString('en-IN', options);
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
    if (!date) {
        return new Date().toISOString().split('T')[0];
    }
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
        return new Date().toISOString().split('T')[0];
    }
    return d.toISOString().split('T')[0];
}

// ============================================
// STATUS CALCULATIONS
// ============================================

/**
 * Check if a date has expired (is in the past)
 */
export function isExpired(expiryDate: string | Date): boolean {
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    const now = new Date();
    return expiry < now;
}

/**
 * Calculate days until expiry
 * Returns negative number if already expired
 */
export function daysUntilExpiry(expiryDate: string | Date): number {
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    const now = new Date();

    // Reset time to midnight for accurate day calculation
    const expiryMidnight = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = expiryMidnight.getTime() - nowMidnight.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get member status based on expiry date
 * - 'active': More than 7 days until expiry
 * - 'due-soon': 7 days or less until expiry (but not expired)
 * - 'expired': Already expired
 */
export type MemberStatus = 'active' | 'due-soon' | 'expired';

export function getMemberStatus(expiryDate: string | Date): MemberStatus {
    const days = daysUntilExpiry(expiryDate);

    if (days < 0) {
        return 'expired';
    } else if (days <= 7) {
        return 'due-soon';
    } else {
        return 'active';
    }
}

/**
 * Get status display properties (label, badge classes)
 */
export interface StatusDisplay {
    label: string;
    badgeClass: string;
    textColor: string;
}

export function getStatusDisplay(status: MemberStatus): StatusDisplay {
    switch (status) {
        case 'active':
            return {
                label: 'Active',
                badgeClass: 'bg-green-100 text-green-800',
                textColor: 'text-green-600',
            };
        case 'due-soon':
            return {
                label: 'Expiring Soon',
                badgeClass: 'bg-yellow-100 text-yellow-800',
                textColor: 'text-yellow-600',
            };
        case 'expired':
            return {
                label: 'Expired',
                badgeClass: 'bg-red-100 text-red-800',
                textColor: 'text-red-600',
            };
    }
}

// ============================================
// RELATIVE TIME
// ============================================

/**
 * Get human-readable relative time (e.g., "in 5 days", "3 days ago")
 */
export function getRelativeTime(date: string | Date): string {
    const days = daysUntilExpiry(date);

    if (days === 0) {
        return 'Today';
    } else if (days === 1) {
        return 'Tomorrow';
    } else if (days === -1) {
        return 'Yesterday';
    } else if (days > 0) {
        return `in ${days} days`;
    } else {
        return `${Math.abs(days)} days ago`;
    }
}
