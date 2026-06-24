'use server';

/**
 * Renewals Server Actions
 *
 * Fetches members whose membership has expired or is approaching expiry,
 * grouped into actionable buckets for the Renewals page. Reuses the same
 * lightweight query pattern as the dashboard (members + plans lookup, no joins).
 */

import { createClient } from '@/lib/supabase/server';

export interface RenewalMember {
    id: string;
    name: string;
    phone: string;
    planName: string;
    expiryDate: string; // ISO date string
    daysLeft: number;    // negative = expired N days ago, 0 = today, positive = days remaining
}

export interface RenewalsData {
    expired: RenewalMember[];
    dueSoon: RenewalMember[];   // 0–7 days
    upcoming: RenewalMember[];  // 8–30 days
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns members needing attention, sorted most-urgent-first within each bucket.
 * Active members with more than 30 days remaining are intentionally excluded.
 */
export async function getRenewals(): Promise<{
    data: RenewalsData | null;
    error: string | null;
}> {
    try {
        const supabase = await createClient();

        // Normalize "today" to midnight so day math is stable.
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const { data: members, error: membersError } = await supabase
            .from('members')
            .select('id, name, phone, expiry_date, plan_id');

        if (membersError) {
            throw new Error(`Failed to fetch members: ${membersError.message}`);
        }

        const { data: plans, error: plansError } = await supabase
            .from('plans')
            .select('id, name');

        if (plansError) {
            throw new Error(`Failed to fetch plans: ${plansError.message}`);
        }

        const planMap = new Map<number, string>();
        for (const plan of plans || []) {
            planMap.set(plan.id, plan.name);
        }

        const expired: RenewalMember[] = [];
        const dueSoon: RenewalMember[] = [];
        const upcoming: RenewalMember[] = [];

        for (const member of members || []) {
            if (!member.expiry_date) continue;

            const expiry = new Date(member.expiry_date);
            const expiryMidnight = new Date(
                expiry.getFullYear(),
                expiry.getMonth(),
                expiry.getDate(),
            );
            const daysLeft = Math.round((expiryMidnight.getTime() - today.getTime()) / MS_PER_DAY);

            const entry: RenewalMember = {
                id: member.id,
                name: member.name || 'Unknown',
                phone: member.phone || '',
                planName: planMap.get(member.plan_id) || 'No plan',
                expiryDate: member.expiry_date,
                daysLeft,
            };

            if (daysLeft < 0) {
                expired.push(entry);
            } else if (daysLeft <= 7) {
                dueSoon.push(entry);
            } else if (daysLeft <= 30) {
                upcoming.push(entry);
            }
            // > 30 days: healthy, skip
        }

        // Most urgent first: expired = closest to today (least negative) first,
        // upcoming buckets = soonest expiry first.
        expired.sort((a, b) => b.daysLeft - a.daysLeft);
        dueSoon.sort((a, b) => a.daysLeft - b.daysLeft);
        upcoming.sort((a, b) => a.daysLeft - b.daysLeft);

        return { data: { expired, dueSoon, upcoming }, error: null };
    } catch (error) {
        console.error('[Renewals] Error fetching data:', error);
        let errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('<!DOCTYPE html>') || errorMessage.includes('525: SSL handshake')) {
            errorMessage = 'Secure connection to database temporarily failed. Please refresh the page.';
        }
        return { data: null, error: errorMessage };
    }
}
