'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Payment = {
    id: number
    member_id: number
    amount: number
    payment_date: string
    mode: string
    created_at: string
}

export type CreatePaymentInput = {
    member_id: number
    amount: number
    payment_date: string
    mode: string
}

// GET ALL PAYMENTS
export async function getPayments(): Promise<{ data: Payment[] | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .order('payment_date', { ascending: false })

        if (error) {
            console.error('[getPayments] Supabase error:', error)
            return { data: null, error: error.message }
        }

        console.log('[getPayments] Success: Retrieved', data?.length || 0, 'payments')
        return { data, error: null }
    } catch (err) {
        console.error('[getPayments] Unexpected error:', err)
        return { data: null, error: 'Failed to fetch payments' }
    }
}

// GET PAYMENTS FOR A MEMBER
export async function getMemberPayments(memberId: number): Promise<{ data: Payment[] | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('member_id', memberId)
            .order('payment_date', { ascending: false })

        if (error) {
            console.error(`[getMemberPayments] Supabase error for member ${memberId}:`, error)
            return { data: null, error: error.message }
        }

        console.log('[getMemberPayments] Success: Retrieved', data?.length || 0, 'payments for member', memberId)
        return { data, error: null }
    } catch (err) {
        console.error('[getMemberPayments] Unexpected error:', err)
        return { data: null, error: 'Failed to fetch member payments' }
    }
}

// CREATE PAYMENT
export async function createPayment(input: CreatePaymentInput): Promise<{ data: Payment | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('payments')
            .insert({
                member_id: input.member_id,
                amount: input.amount,
                payment_date: input.payment_date,
                mode: input.mode,
            })
            .select()
            .single()

        if (error) {
            console.error('[createPayment] Supabase error:', error)
            return { data: null, error: error.message }
        }

        console.log('[createPayment] Success: Created payment', data.id)
        revalidatePath('/members')
        revalidatePath('/payments')
        revalidatePath('/')
        return { data, error: null }
    } catch (err) {
        console.error('[createPayment] Unexpected error:', err)
        return { data: null, error: 'Failed to create payment' }
    }
}

// GET MONTHLY REVENUE (current month)
export async function getMonthlyRevenue(): Promise<{ data: number; error: string | null }> {
    try {
        const supabase = await createClient()

        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        const { data: payments, error } = await supabase
            .from('payments')
            .select('amount, payment_date')

        if (error) {
            console.error('[getMonthlyRevenue] Supabase error:', error)
            return { data: 0, error: error.message }
        }

        // Filter by current month (payment_date is stored as text, format: YYYY-MM-DD)
        const monthlyRevenue = payments
            ?.filter(p => {
                if (!p.payment_date) return false
                const [year, month] = p.payment_date.split('-').map(Number)
                return year === currentYear && month === currentMonth
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

        console.log('[getMonthlyRevenue] Success: Monthly revenue', monthlyRevenue)
        return { data: monthlyRevenue, error: null }
    } catch (err) {
        console.error('[getMonthlyRevenue] Unexpected error:', err)
        return { data: 0, error: 'Failed to calculate monthly revenue' }
    }
}

// GET TOTAL REVENUE (all time)
export async function getTotalRevenue(): Promise<{ data: number; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data: payments, error } = await supabase
            .from('payments')
            .select('amount')

        if (error) {
            console.error('[getTotalRevenue] Supabase error:', error)
            return { data: 0, error: error.message }
        }

        const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

        console.log('[getTotalRevenue] Success: Total revenue', totalRevenue)
        return { data: totalRevenue, error: null }
    } catch (err) {
        console.error('[getTotalRevenue] Unexpected error:', err)
        return { data: 0, error: 'Failed to calculate total revenue' }
    }
}
