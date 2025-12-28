/**
 * Member Phone Authentication Utilities
 * Handles phone-based session management for members
 */

import { createClient } from '@/lib/supabase/client';

export interface MemberSession {
    memberId: number;
    phone: string;
    name: string;
    createdAt: string;
}

const MEMBER_SESSION_KEY = 'gym_member_session';
const SESSION_EXPIRY_DAYS = 30;

/**
 * Validate if phone number exists in members table
 * @param phone Phone number to validate
 * @returns Member data if exists, null otherwise
 */
export async function validatePhoneExists(phone: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('members')
        .select(`
            id,
            name,
            phone,
            email,
            photo_url,
            plan_id,
            start_date,
            expiry_date,
            created_at,
            plans (
                id,
                name,
                price,
                duration_days
            )
        `)
        .eq('phone', phone)
        .single();

    if (error || !data) {
        console.error('Phone validation error:', error);
        return null;
    }

    return data;
}

/**
 * Create member session and store in localStorage
 * @param memberId Member ID
 * @param phone Member phone number
 * @param name Member name
 */
export function createMemberSession(memberId: number, phone: string, name: string): void {
    const session: MemberSession = {
        memberId,
        phone,
        name,
        createdAt: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
        localStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(session));
    }
}

/**
 * Get current member session from localStorage
 * @returns Member session if valid, null otherwise
 */
export function getMemberSession(): MemberSession | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const sessionData = localStorage.getItem(MEMBER_SESSION_KEY);
    if (!sessionData) {
        return null;
    }

    try {
        const session: MemberSession = JSON.parse(sessionData);

        // Check if session is expired
        const createdAt = new Date(session.createdAt);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > SESSION_EXPIRY_DAYS) {
            clearMemberSession();
            return null;
        }

        return session;
    } catch (error) {
        console.error('Failed to parse member session:', error);
        clearMemberSession();
        return null;
    }
}

/**
 * Clear member session from localStorage
 */
export function clearMemberSession(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(MEMBER_SESSION_KEY);
    }
}

/**
 * Check if member is logged in
 * @returns true if member session exists and is valid
 */
export function isMemberLoggedIn(): boolean {
    return getMemberSession() !== null;
}

/**
 * Get member data by phone from current session
 * @returns Member data if session exists and phone is valid
 */
export async function getMemberByPhone(phone: string) {
    return validatePhoneExists(phone);
}
