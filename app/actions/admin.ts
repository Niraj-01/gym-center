'use server';

import { createClient } from '@/lib/supabase/server';

export interface ChangePasswordResult {
    success: boolean;
    error?: string;
}

/**
 * Change admin password
 */
export async function changeAdminPassword(
    email: string,
    currentPassword: string,
    newPassword: string
): Promise<ChangePasswordResult> {
    try {
        const supabase = await createClient();

        // Validate new password length
        if (newPassword.length < 6) {
            return {
                success: false,
                error: 'New password must be at least 6 characters long',
            };
        }

        // Verify current credentials
        const { data: admin, error: fetchError } = await supabase
            .from('admins')
            .select('password')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (fetchError || !admin) {
            console.error('[changePassword] Admin not found:', fetchError);
            return {
                success: false,
                error: 'Admin account not found',
            };
        }

        // Check current password
        if (admin.password !== currentPassword) {
            return {
                success: false,
                error: 'Current password is incorrect',
            };
        }

        // Update password
        const { error: updateError } = await supabase
            .from('admins')
            .update({ password: newPassword })
            .eq('email', email.toLowerCase().trim());

        if (updateError) {
            console.error('[changePassword] Update error:', updateError);
            return {
                success: false,
                error: 'Failed to update password. Please try again.',
            };
        }

        console.log('[changePassword] Password updated successfully for:', email);
        return { success: true };
    } catch (error) {
        console.error('[changePassword] Unexpected error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred. Please try again.',
        };
    }
}
