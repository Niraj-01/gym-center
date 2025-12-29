'use client';

/**
 * Simple Auth - Email/Password Authentication Utility
 * Manages admin authentication against the admins table in Supabase
 */

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface AdminSession {
    email: string;
    isLoggedIn: boolean;
    loginTime: number;
}

// Session expiry: 24 hours
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Verify admin credentials against the admins table
 */
export async function verifyAdminCredentials(
    email: string,
    password: string
): Promise<boolean> {
    try {
        // Trim whitespace and convert email to lowercase
        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password.trim();

        console.log('Attempting login with:', { email: cleanEmail }); // Debug log

        const { data, error } = await supabase
            .from('admins')
            .select('email, password')
            .eq('email', cleanEmail)
            .eq('password', cleanPassword) // NOTE: In production, password should be hashed!
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return false;
        }

        if (!data) {
            console.log('No matching admin found');
            return false;
        }

        console.log('Login successful!'); // Debug log
        return true;
    } catch (error) {
        console.error('Error verifying credentials:', error);
        return false;
    }
}

/**
 * Create admin session in localStorage
 */
export function createAdminSession(email: string): void {
    if (typeof window === 'undefined') return;

    const session: AdminSession = {
        email: email.toLowerCase().trim(),
        isLoggedIn: true,
        loginTime: Date.now(),
    };

    localStorage.setItem('admin_session', JSON.stringify(session));
}

/**
 * Get current admin session from localStorage
 */
export function getAdminSession(): AdminSession | null {
    if (typeof window === 'undefined') return null;

    try {
        const sessionData = localStorage.getItem('admin_session');
        if (!sessionData) return null;

        const session: AdminSession = JSON.parse(sessionData);

        // Check if session is expired
        if (Date.now() - session.loginTime > SESSION_EXPIRY_MS) {
            clearAdminSession();
            return null;
        }

        return session;
    } catch (error) {
        console.error('Error reading session:', error);
        return null;
    }
}

/**
 * Clear admin session from localStorage
 */
export function clearAdminSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('admin_session');
}

/**
 * Check if admin is currently logged in
 */
export function isAdminLoggedIn(): boolean {
    const session = getAdminSession();
    return session !== null && session.isLoggedIn;
}
