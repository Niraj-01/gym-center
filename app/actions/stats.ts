'use server'

import { createClient } from '@/lib/supabase/server'

export type DashboardStats = {
    totalMembers: number
    activeMembers: number
    expiringSoon: number
    expired: number
    monthlyRevenue: number
    totalRevenue: number
}

// GET DASHBOARD STATISTICS
export async function getDashboardStats(): Promise<{ data: DashboardStats | null; error: string | null }> {
    try {
        const supabase = await createClient()

        // Fetch all members
        const { data: members, error: membersError } = await supabase
            .from('members')
            .select('expiry_date')

        if (membersError) {
            console.error('[getDashboardStats] Members error:', membersError)
            return { data: null, error: membersError.message }
        }

        // Fetch all payments
        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('amount, payment_date')

        if (paymentsError) {
            console.error('[getDashboardStats] Payments error:', paymentsError)
            return { data: null, error: paymentsError.message }
        }

        // Calculate member statistics
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const sevenDaysFromNow = new Date(today)
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

        let activeMembers = 0
        let expiringSoon = 0
        let expired = 0

        members?.forEach(member => {
            if (!member.expiry_date) {
                expired++
                return
            }

            const expiryDate = new Date(member.expiry_date)
            expiryDate.setHours(0, 0, 0, 0)

            if (expiryDate < today) {
                expired++
            } else if (expiryDate <= sevenDaysFromNow) {
                expiringSoon++
            } else {
                activeMembers++
            }
        })

        // Calculate revenue
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        const monthlyRevenue = payments
            ?.filter(p => {
                if (!p.payment_date) return false
                const [year, month] = p.payment_date.split('-').map(Number)
                return year === currentYear && month === currentMonth
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

        const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

        const stats: DashboardStats = {
            totalMembers: members?.length || 0,
            activeMembers,
            expiringSoon,
            expired,
            monthlyRevenue,
            totalRevenue,
        }

        console.log('[getDashboardStats] Success:', stats)
        return { data: stats, error: null }
    } catch (err) {
        console.error('[getDashboardStats] Unexpected error:', err)
        return { data: null, error: 'Failed to fetch dashboard statistics' }
    }
}

// GET RECENT PAYMENTS (for dashboard display)
export async function getRecentPayments(limit: number = 5): Promise<{
    data: Array<{
        id: number
        member_id: number
        amount: number
        payment_date: string
        mode: string
    }> | null
    error: string | null
}> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('payments')
            .select('id, member_id, amount, payment_date, mode')
            .order('payment_date', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('[getRecentPayments] Supabase error:', error)
            return { data: null, error: error.message }
        }

        console.log('[getRecentPayments] Success: Retrieved', data?.length || 0, 'recent payments')
        return { data, error: null }
    } catch (err) {
        console.error('[getRecentPayments] Unexpected error:', err)
        return { data: null, error: 'Failed to fetch recent payments' }
    }
}
