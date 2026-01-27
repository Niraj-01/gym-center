'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/utils/logger'

export type Plan = {
    id: number
    name: string
    duration_days: number
    price: number
    is_active: boolean
}

export type CreatePlanInput = {
    name: string
    duration_days: number
    price: number
    is_active?: boolean
}

export type UpdatePlanInput = {
    id: number
    name?: string
    duration_days?: number
    price?: number
    is_active?: boolean
}

// GET ALL PLANS
export async function getPlans(): Promise<{ data: Plan[] | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('plans')
            .select('id, name, duration_days, price, is_active')
            .order('price', { ascending: true })

        if (error) {
            logger.error('[getPlans] Supabase error:', error)
            return { data: null, error: error.message }
        }

        logger.log('[getPlans] Success: Retrieved', data?.length || 0, 'plans')
        return { data: data as Plan[], error: null }
    } catch (err) {
        logger.error('[getPlans] Unexpected error:', err)
        return { data: null, error: 'Failed to fetch plans' }
    }
}

// GET ACTIVE PLANS ONLY
export async function getActivePlans(): Promise<{ data: Plan[] | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true })

        if (error) {
            logger.error('[getActivePlans] Supabase error:', error)
            return { data: null, error: error.message }
        }

        logger.log('[getActivePlans] Success: Retrieved', data?.length || 0, 'active plans')
        return { data, error: null }
    } catch (err) {
        logger.error('[getActivePlans] Unexpected error:', err)
        return { data: null, error: 'Failed to fetch active plans' }
    }
}

// GET SINGLE PLAN
export async function getPlan(id: number): Promise<{ data: Plan | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            logger.error(`[getPlan] Supabase error for id ${id}:`, error)
            return { data: null, error: error.message }
        }

        logger.log('[getPlan] Success: Retrieved plan', id)
        return { data, error: null }
    } catch (err) {
        logger.error('[getPlan] Unexpected error:', err)
        return { data: null, error: 'Failed to fetch plan' }
    }
}

// CREATE PLAN
export async function createPlan(input: CreatePlanInput): Promise<{ data: Plan | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('plans')
            .insert({
                name: input.name,
                duration_days: input.duration_days,
                price: input.price,
                is_active: input.is_active ?? true,
            })
            .select()
            .single()

        if (error) {
            logger.error('[createPlan] Supabase error:', error)
            return { data: null, error: error.message }
        }

        logger.success('[createPlan] Success: Created plan', data.id)
        revalidatePath('/plans')
        revalidatePath('/')
        return { data, error: null }
    } catch (err) {
        logger.error('[createPlan] Unexpected error:', err)
        return { data: null, error: 'Failed to create plan' }
    }
}

// UPDATE PLAN
export async function updatePlan(input: UpdatePlanInput): Promise<{ data: Plan | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { id, ...updates } = input

        const { data, error } = await supabase
            .from('plans')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            logger.error(`[updatePlan] Supabase error for id ${id}:`, error)
            return { data: null, error: error.message }
        }

        logger.success('[updatePlan] Success: Updated plan', id)
        revalidatePath('/plans')
        revalidatePath('/')
        return { data, error: null }
    } catch (err) {
        logger.error('[updatePlan] Unexpected error:', err)
        return { data: null, error: 'Failed to update plan' }
    }
}

// DELETE PLAN
export async function deletePlan(id: number): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('plans')
            .delete()
            .eq('id', id)

        if (error) {
            logger.error(`[deletePlan] Supabase error for id ${id}:`, error)
            return { success: false, error: error.message }
        }

        logger.success('[deletePlan] Success: Deleted plan', id)
        revalidatePath('/plans')
        revalidatePath('/')
        return { success: true, error: null }
    } catch (err) {
        logger.error('[deletePlan] Unexpected error:', err)
        return { success: false, error: 'Failed to delete plan' }
    }
}

// TOGGLE PLAN STATUS
export async function togglePlanStatus(id: number): Promise<{ data: Plan | null; error: string | null }> {
    try {
        const supabase = await createClient()

        // First get current status
        const { data: plan, error: fetchError } = await supabase
            .from('plans')
            .select('is_active')
            .eq('id', id)
            .single()

        if (fetchError) {
            console.error(`[togglePlanStatus] Fetch error for id ${id}:`, fetchError)
            return { data: null, error: fetchError.message }
        }

        // Toggle status
        const { data, error } = await supabase
            .from('plans')
            .update({ is_active: !plan.is_active })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            logger.error(`[togglePlanStatus] Update error for id ${id}:`, error)
            return { data: null, error: error.message }
        }

        logger.success('[togglePlanStatus] Success: Toggled plan', id, 'to', data.is_active)
        revalidatePath('/plans')
        revalidatePath('/')
        return { data, error: null }
    } catch (err) {
        logger.error('[togglePlanStatus] Unexpected error:', err)
        return { data: null, error: 'Failed to toggle plan status' }
    }
}
