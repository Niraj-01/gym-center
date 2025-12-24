/**
 * Member Types - Based on Phase 2 Firestore Schema
 */

export interface Member {
    id: string;                    // Firestore document ID
    name: string;
    phone: string;
    email?: string;
    photoUrl?: string;             // Optional profile photo URL
    joinDate: Date;

    // Current membership
    planId: string;
    planName: string;
    membershipStartDate: Date;
    membershipExpiryDate: Date;

    // Additional
    notes?: string;
    isActive: boolean;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

export interface MemberFormData {
    name: string;
    phone: string;
    email?: string;
    photoUrl?: string;             // Optional profile photo URL
    joinDate: Date;
    planId: string;
    membershipStartDate: Date;
    notes?: string;
}

export type MemberStatus = 'active' | 'due-soon' | 'expired';

/**
 * Calculate member status based on expiry date
 * This is NEVER stored in Firestore - always derived
 */
export function getMemberStatus(expiryDate: Date): MemberStatus {
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry >= 7) return 'active';
    if (daysUntilExpiry >= 0) return 'due-soon';
    return 'expired';
}

/**
 * Get status display info (color, label)
 */
export function getStatusDisplay(status: MemberStatus) {
    switch (status) {
        case 'active':
            return { label: 'Active', color: 'text-gray-900' };
        case 'due-soon':
            return { label: 'Due Soon', color: 'text-gray-600' };
        case 'expired':
            return { label: 'Expired', color: 'text-gray-400' };
    }
}
