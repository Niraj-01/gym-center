'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/utils/logger'

export type Member = {
    id: number
    name: string
    email: string
    phone: string
    plan: string
    plan_id: number | null
    start_date: string
    expiry_date: string
    photo_url: string | null
    created_at: string
}

export type CreateMemberInput = {
    name: string
    email: string
    phone: string
    plan: string
    plan_id: number | null
    start_date: string
    expiry_date: string
    photo_url?: string | null
}

export type UpdateMemberInput = {
    id: number
    name?: string
    email?: string
    phone?: string
    plan?: string
    plan_id?: number | null
    start_date?: string
    expiry_date?: string
    photo_url?: string | null
}

// GET ALL MEMBERS
export async function getMembers(): Promise<{ data: Member[] | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            logger.error('[getMembers] Supabase error:', error)
            return { data: null, error: error.message }
        }

        logger.log('[getMembers] Success: Retrieved', data?.length || 0, 'members')
        return { data, error: null }
    } catch (err) {
        logger.error('[getMembers] Unexpected error:', err)
        return { data: null, error: 'Failed to fetch members' }
    }
}

// GET SINGLE MEMBER
export async function getMember(id: number): Promise<{ data: Member | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            logger.error(`[getMember] Supabase error for id ${id}:`, error)
            return { data: null, error: error.message }
        }

        logger.log('[getMember] Success: Retrieved member', id)
        return { data, error: null }
    } catch (err) {
        logger.error('[getMember] Unexpected error:', err)
        return { data: null, error: 'Failed to fetch member' }
    }
}

// CREATE MEMBER
export async function createMember(input: CreateMemberInput): Promise<{ data: Member | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('members')
            .insert({
                name: input.name,
                email: input.email,
                phone: input.phone,
                plan: input.plan,
                plan_id: input.plan_id,
                start_date: input.start_date,
                expiry_date: input.expiry_date,
                photo_url: input.photo_url || null,
            })
            .select()
            .single()

        if (error) {
            logger.error('[createMember] Supabase error:', error)
            return { data: null, error: error.message }
        }

        logger.success('[createMember] Success: Created member', data.id)
        revalidatePath('/members')
        revalidatePath('/')
        return { data, error: null }
    } catch (err) {
        logger.error('[createMember] Unexpected error:', err)
        return { data: null, error: 'Failed to create member' }
    }
}

// UPDATE MEMBER
export async function updateMember(input: UpdateMemberInput): Promise<{ data: Member | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { id, ...updates } = input

        const { data, error } = await supabase
            .from('members')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            logger.error(`[updateMember] Supabase error for id ${id}:`, error)
            return { data: null, error: error.message }
        }

        logger.success('[updateMember] Success: Updated member', id)
        revalidatePath('/members')
        revalidatePath('/')
        return { data, error: null }
    } catch (err) {
        logger.error('[updateMember] Unexpected error:', err)
        return { data: null, error: 'Failed to update member' }
    }
}

// DELETE MEMBER
export async function deleteMember(id: number): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient()

        const { error, count } = await supabase
            .from('members')
            .delete({ count: 'exact' })
            .eq('id', id)

        if (error) {
            logger.error(`[deleteMember] Supabase error for id ${id}:`, error)
            return { success: false, error: error.message }
        }

        if (count === 0) {
            logger.error(`[deleteMember] No member found with id ${id} to delete`)
            return { success: false, error: 'Member not found or already deleted' }
        }

        logger.success('[deleteMember] Success: Deleted member', id)
        revalidatePath('/members')
        revalidatePath('/')
        return { success: true, error: null }
    } catch (err) {
        logger.error('[deleteMember] Unexpected error:', err)
        return { success: false, error: 'Failed to delete member' }
    }
}

// ============================================
// PAGINATED MEMBERS WITH SERVER-SIDE FILTERING
// ============================================

export type MemberStatus = 'all' | 'active' | 'due-soon' | 'expired';
export type SortField = 'name' | 'expiry_date' | 'created_at';
export type SortOrder = 'asc' | 'desc';

export interface PaginatedMembersParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: MemberStatus;
    planId?: number;
    sort?: SortField;
    order?: SortOrder;
}

export interface PaginatedMember {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    photo_url: string | null;
    start_date: string;
    expiry_date: string;
    plan_id: number | null;
    plan_name: string;
    created_at: string;
    status: 'active' | 'due-soon' | 'expired';
}

export interface PaginatedMembersResult {
    data: PaginatedMember[] | null;
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    error: string | null;
}

/**
 * Get paginated members with server-side filtering and sorting
 * All filtering, sorting, and pagination happens in Supabase
 */
export async function getPaginatedMembers(
    params: PaginatedMembersParams = {}
): Promise<PaginatedMembersResult> {
    try {
        const supabase = await createClient();

        // Defaults
        const page = params.page || 1;
        const pageSize = params.pageSize || 20;
        const search = params.search?.trim() || '';
        const status = params.status || 'all';
        const sort = params.sort || 'name';
        const order = params.order || 'asc';

        // Calculate range for pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Calculate date thresholds for status filtering
        const now = new Date();
        const nowISO = now.toISOString();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const sevenDaysISO = sevenDaysFromNow.toISOString();

        // Build base query with plan join
        let query = supabase
            .from('members')
            .select(`
                id,
                name,
                phone,
                email,
                photo_url,
                start_date,
                expiry_date,
                plan_id,
                created_at,
                plans (
                    id,
                    name
                )
            `, { count: 'exact' });

        // Apply search filter (name OR phone, case-insensitive)
        if (search) {
            query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        // Apply status filter using expiry_date comparison
        if (status === 'active') {
            // Active: expiry_date > 7 days from now
            query = query.gt('expiry_date', sevenDaysISO);
        } else if (status === 'due-soon') {
            // Due soon: expiry_date is between now and 7 days from now
            query = query.gte('expiry_date', nowISO).lte('expiry_date', sevenDaysISO);
        } else if (status === 'expired') {
            // Expired: expiry_date < now
            query = query.lt('expiry_date', nowISO);
        }

        // Apply plan filter
        if (params.planId) {
            query = query.eq('plan_id', params.planId);
        }

        // Apply sorting
        query = query.order(sort, { ascending: order === 'asc' });

        // Apply pagination
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            logger.error('[getPaginatedMembers] Supabase error:', error);
            return {
                data: null,
                totalCount: 0,
                page,
                pageSize,
                totalPages: 0,
                error: error.message,
            };
        }

        // Format response with status calculation
        const formattedMembers: PaginatedMember[] = (data || []).map((member) => {
            const expiryDate = new Date(member.expiry_date);
            let memberStatus: 'active' | 'due-soon' | 'expired';

            if (expiryDate < now) {
                memberStatus = 'expired';
            } else if (expiryDate <= sevenDaysFromNow) {
                memberStatus = 'due-soon';
            } else {
                memberStatus = 'active';
            }

            // Type assertion for nested relation
            const plan = member.plans as unknown as { id: number; name: string } | null;

            return {
                id: member.id,
                name: member.name,
                phone: member.phone,
                email: member.email,
                photo_url: member.photo_url,
                start_date: member.start_date,
                expiry_date: member.expiry_date,
                plan_id: member.plan_id,
                plan_name: plan?.name || 'Unknown Plan',
                created_at: member.created_at,
                status: memberStatus,
            };
        });

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / pageSize);

        logger.log(`[getPaginatedMembers] Success: Page ${page}/${totalPages}, ${formattedMembers.length} members`);

        return {
            data: formattedMembers,
            totalCount,
            page,
            pageSize,
            totalPages,
            error: null,
        };
    } catch (err) {
        logger.error('[getPaginatedMembers] Unexpected error:', err);
        return {
            data: null,
            totalCount: 0,
            page: 1,
            pageSize: 20,
            totalPages: 0,
            error: 'Failed to fetch members',
        };
    }
}

// ============================================
// UPI ID MANAGEMENT
// ============================================

/**
 * Get member's UPI ID by member ID
 */
export async function getMemberUPI(memberId: number): Promise<{ upiId: string | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('members')
            .select('upi_id')
            .eq('id', memberId)
            .single();

        if (error) {
            logger.error(`[getMemberUPI] Error for member ${memberId}:`, error);
            return { upiId: null, error: error.message };
        }

        return { upiId: data?.upi_id || null, error: null };
    } catch (err) {
        logger.error('[getMemberUPI] Unexpected error:', err);
        return { upiId: null, error: 'Failed to fetch UPI ID' };
    }
}

/**
 * Get member's UPI ID by phone number (for member portal)
 */
export async function getMemberUPIByPhone(phone: string): Promise<{ upiId: string | null; memberId: number | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('members')
            .select('id, upi_id')
            .eq('phone', phone)
            .single();

        if (error) {
            logger.error(`[getMemberUPIByPhone] Error for phone ${phone}:`, error);
            return { upiId: null, memberId: null, error: error.message };
        }

        return { upiId: data?.upi_id || null, memberId: data?.id || null, error: null };
    } catch (err) {
        logger.error('[getMemberUPIByPhone] Unexpected error:', err);
        return { upiId: null, memberId: null, error: 'Failed to fetch UPI ID' };
    }
}

/**
 * Update member's UPI ID
 * Validates UPI format before saving
 */
export async function updateMemberUPI(
    memberId: number,
    upiId: string
): Promise<{ success: boolean; upiId: string | null; error: string | null }> {
    try {
        // Validate UPI format: username@bankname
        const upiRegex = /^[\w.-]+@[\w.-]+$/;
        const trimmedUPI = upiId.trim().toLowerCase();

        if (!upiRegex.test(trimmedUPI)) {
            return {
                success: false,
                upiId: null,
                error: 'Invalid UPI ID format. Use format: yourname@bankname',
            };
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('members')
            .update({
                upi_id: trimmedUPI,
                upi_updated_at: new Date().toISOString(),
            })
            .eq('id', memberId)
            .select('upi_id')
            .single();

        if (error) {
            logger.error(`[updateMemberUPI] Error for member ${memberId}:`, error);
            return { success: false, upiId: null, error: error.message };
        }

        logger.success(`[updateMemberUPI] Updated UPI for member ${memberId}`);
        revalidatePath('/member/dashboard');

        return { success: true, upiId: data?.upi_id || trimmedUPI, error: null };
    } catch (err) {
        logger.error('[updateMemberUPI] Unexpected error:', err);
        return { success: false, upiId: null, error: 'Failed to update UPI ID' };
    }
}

