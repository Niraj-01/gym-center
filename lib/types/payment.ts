/**
 * Payment Types - Based on Phase 2 Firestore Schema
 */

export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank-transfer';

export interface Payment {
    id: string;                    // Firestore document ID
    memberId: string;
    memberName: string;            // Denormalized
    memberPhone: string;           // Denormalized

    amount: number;
    paymentDate: Date;
    paymentMode: PaymentMode;

    planId: string;
    planName: string;              // Denormalized
    durationDays: number;          // Denormalized from plan

    previousExpiryDate: Date;      // Expiry before payment
    newExpiryDate: Date;           // Expiry after payment

    notes?: string;
    receiptNumber?: string;

    createdAt: Date;
    createdBy: string;             // Admin email
}

export interface PaymentFormData {
    memberId: string;
    planId: string;
    amount: number;
    paymentDate: Date;
    paymentMode: PaymentMode;
    notes?: string;
    receiptNumber?: string;
}
