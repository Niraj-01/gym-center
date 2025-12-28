'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
            console.error('[getMembers] Supabase error:', error)
            return { data: null, error: error.message }
        }

        console.log('[getMembers] Success: Retrieved', data?.length || 0, 'members')
        return { data, error: null }
    } catch (err) {
        console.error('[getMembers] Unexpected error:', err)
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
            console.error(`[getMember] Supabase error for id ${id}:`, error)
            return { data: null, error: error.message }
        }

        console.log('[getMember] Success: Retrieved member', id)
        return { data, error: null }
    } catch (err) {
        console.error('[getMember] Unexpected error:', err)
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
            console.error('[createMember] Supabase error:', error)
            return { data: null, error: error.message }
        }

        console.log('[createMember] Success: Created member', data.id)
        revalidatePath('/members')
        revalidatePath('/')
        return { data, error: null }
    } catch (err) {
        console.error('[createMember] Unexpected error:', err)
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
            console.error(`[updateMember] Supabase error for id ${id}:`, error)
            return { data: null, error: error.message }
        }

        console.log('[updateMember] Success: Updated member', id)
        revalidatePath('/members')
        revalidatePath('/')
        return { data, error: null }
    } catch (err) {
        console.error('[updateMember] Unexpected error:', err)
        return { data: null, error: 'Failed to update member' }
    }
}

// DELETE MEMBER
export async function deleteMember(id: number): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', id)

        if (error) {
            console.error(`[deleteMember] Supabase error for id ${id}:`, error)
            return { success: false, error: error.message }
        }

        console.log('[deleteMember] Success: Deleted member', id)
        revalidatePath('/members')
        revalidatePath('/')
        return { success: true, error: null }
    } catch (err) {
        console.error('[deleteMember] Unexpected error:', err)
        return { success: false, error: 'Failed to delete member' }
    }
}
