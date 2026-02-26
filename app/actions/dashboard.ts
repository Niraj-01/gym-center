'use server';

/**
 * Dashboard Server Actions
 * 
 * Optimized server-side data fetching for the dashboard.
 * Uses efficient queries with minimal data transfer.
 */

import { createClient } from '@/lib/supabase/server';

// Types for dashboard data
export interface DashboardStats {
    totalMembers: number;
    activeMembers: number;
    dueSoonMembers: number;
    expiredMembers: number;
    thisMonthRevenue: number;
    totalRevenue: number;
}

export interface DashboardPayment {
    id: string;
    memberId: string;
    memberName: string;
    memberPhone: string;
    amount: number;
    paymentDate: string;
    paymentMode: string;
    planId: number;
    planName: string;
    notes: string | null;
}

export interface DashboardData {
    stats: DashboardStats;
    recentPayments: DashboardPayment[];
}

/**
 * Get all dashboard data in optimized queries
 * Reduced from 4 separate queries to 3, with minimal data fetched per query
 */
export async function getDashboardData(): Promise<{
    data: DashboardData | null;
    error: string | null;
}> {
    try {
        const supabase = await createClient();
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Query 1: Get all members with just id and expiry_date for stats calculation
        // Only fetches the columns needed for status calculation
        const { data: members, error: membersError } = await supabase
            .from('members')
            .select('id, name, phone, expiry_date');

        if (membersError) {
            throw new Error(`Failed to fetch members: ${membersError.message}`);
        }

        // Create a lookup map for members
        const memberMap = new Map<string, { name: string; phone: string }>();
        let activeCount = 0;
        let dueSoonCount = 0;
        let expiredCount = 0;

        for (const member of members || []) {
            // Build member lookup
            memberMap.set(member.id, { name: member.name, phone: member.phone });

            // Calculate status
            const expiryDate = new Date(member.expiry_date);
            if (expiryDate < now) {
                expiredCount++;
            } else if (expiryDate <= sevenDaysFromNow) {
                dueSoonCount++;
            } else {
                activeCount++;
            }
        }

        // Query 2: Get all plans for lookup
        const { data: plans, error: plansError } = await supabase
            .from('plans')
            .select('id, name');

        if (plansError) {
            throw new Error(`Failed to fetch plans: ${plansError.message}`);
        }

        // Create plan lookup map
        const planMap = new Map<number, string>();
        for (const plan of plans || []) {
            planMap.set(plan.id, plan.name);
        }

        // Query 3: Get recent payments (just the raw data, no joins)
        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('id, member_id, plan_id, amount, payment_date, mode, notes')
            .order('payment_date', { ascending: false })
            .limit(50);

        if (paymentsError) {
            throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
        }

        // Calculate revenue and format payments using lookup maps
        let thisMonthRevenue = 0;
        let totalRevenue = 0;
        const formattedPayments: DashboardPayment[] = [];

        for (const payment of payments || []) {
            const paymentDate = new Date(payment.payment_date);
            const amount = payment.amount || 0;

            totalRevenue += amount;

            if (paymentDate >= startOfMonth) {
                thisMonthRevenue += amount;
            }

            // Use lookup maps for member and plan names
            const member = memberMap.get(payment.member_id);
            const planName = planMap.get(payment.plan_id);

            formattedPayments.push({
                id: payment.id,
                memberId: payment.member_id,
                memberName: member?.name || 'Unknown',
                memberPhone: member?.phone || '',
                amount: amount,
                paymentDate: payment.payment_date,
                paymentMode: payment.mode || 'cash',
                planId: payment.plan_id,
                planName: planName || 'Unknown Plan',
                notes: payment.notes,
            });
        }

        const stats: DashboardStats = {
            totalMembers: (members || []).length,
            activeMembers: activeCount,
            dueSoonMembers: dueSoonCount,
            expiredMembers: expiredCount,
            thisMonthRevenue,
            totalRevenue,
        };

        return {
            data: {
                stats,
                recentPayments: formattedPayments.slice(0, 10),
            },
            error: null,
        };
    } catch (error) {
        console.error('[Dashboard] Error fetching data:', error);
        let errorMessage = error instanceof Error ? error.message : String(error);

        // Clean up Cloudflare 525 HTML error responses
        if (errorMessage.includes('<!DOCTYPE html>') || errorMessage.includes('525: SSL handshake')) {
            errorMessage = 'Secure connection to database temporarily failed. Please refresh the page.';
        }

        return {
            data: null,
            error: errorMessage,
        };
    }
}
