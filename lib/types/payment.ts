/**
 * Payment Types - Based on Supabase Schema
 */

export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank-transfer';

export interface Payment {
    id: number;
    memberId: number;
    memberName: string;            // Joined from members
    memberPhone: string;           // Joined from members
    amount: number;
    paymentDate: Date;
    paymentMode: PaymentMode;
    planId?: number;
    planName?: string;             // Joined from plans
    notes?: string;
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
