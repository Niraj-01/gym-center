// Date utilities for Supabase
export function formatDateForDB(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
        console.error('❌ Invalid date:', date);
        throw new Error(`Invalid date: ${date}`);
    }

    return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

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

export function calculateExpiryDate(startDate: Date | string, durationDays: number): string {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const expiry = new Date(start);
    expiry.setDate(expiry.getDate() + durationDays);
    return formatDateForDB(expiry);
}
