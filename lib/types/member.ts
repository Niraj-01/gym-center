/**
 * Member Types - Based on Phase 2 Firestore Schema
 */

export interface Member {
    id: string;
    name: string;
    email: string;  // Added for member authentication and lookup
    phone: string;
    planId: string;
    planName: string;
    membershipStartDate: Date;
    membershipExpiryDate: Date;
    joinDate: Date;
    photoUrl?: string;  // Optional profile photo URL
    // Additional
    notes?: string;
    isActive: boolean;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

export interface MemberFormData {
    name: string;
    email: string;  // Added for member authentication
    phone: string;
    planId: string;
    membershipStartDate: Date;
    photoUrl?: string;
    joinDate: Date;
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
 * Get status display info (color, label, badge classes)
 */
export function getStatusDisplay(status: MemberStatus) {
    switch (status) {
        case 'active':
            return {
                label: 'Active',
                color: 'text-green-800',
                badgeClass: 'bg-green-100 text-green-800'
            };
        case 'due-soon':
            return {
                label: 'Expiring Soon',
                color: 'text-yellow-800',
                badgeClass: 'bg-yellow-100 text-yellow-800'
            };
        case 'expired':
            return {
                label: 'Expired',
                color: 'text-red-800',
                badgeClass: 'bg-red-100 text-red-800'
            };
    }
}
