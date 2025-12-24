/**
 * Plan Types - Based on Phase 2 Firestore Schema
 */

export interface Plan {
    id: string;                    // Firestore document ID
    name: string;
    duration: number;              // Duration in days
    price: number;
    description?: string;
    isActive: boolean;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

export interface PlanFormData {
    name: string;
    duration: number;
    price: number;
    description?: string;
}
