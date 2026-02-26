import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const results = {
        timestamp: new Date().toISOString(),
        tests: [] as Array<{
            name: string
            status: 'PASS' | 'FAIL'
            message: string
            details?: unknown
        }>,
    }

    try {
        const supabase = await createClient()

        // TEST 1: Environment Variables
        results.tests.push({
            name: 'Environment Variables',
            status: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PASS' : 'FAIL',
            message: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                ? 'Environment variables are set'
                : 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
            details: {
                url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing',
                key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
            },
        })

        // TEST 2: Read Plans Table
        const { data: plans, error: plansError } = await supabase
            .from('plans')
            .select('*')

        results.tests.push({
            name: 'Read Plans Table',
            status: !plansError ? 'PASS' : 'FAIL',
            message: !plansError
                ? `Successfully read ${plans?.length || 0} plans`
                : `Error: ${plansError.message}`,
            details: { count: plans?.length || 0, columns: plans?.[0] ? Object.keys(plans[0]) : [] },
        })

        // TEST 3: Read Members Table
        const { data: members, error: membersError } = await supabase
            .from('members')
            .select('*')

        results.tests.push({
            name: 'Read Members Table',
            status: !membersError ? 'PASS' : 'FAIL',
            message: !membersError
                ? `Successfully read ${members?.length || 0} members`
                : `Error: ${membersError.message}`,
            details: { count: members?.length || 0, columns: members?.[0] ? Object.keys(members[0]) : [] },
        })

        // TEST 4: Read Payments Table
        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('*')

        results.tests.push({
            name: 'Read Payments Table',
            status: !paymentsError ? 'PASS' : 'FAIL',
            message: !paymentsError
                ? `Successfully read ${payments?.length || 0} payments`
                : `Error: ${paymentsError.message}`,
            details: { count: payments?.length || 0, columns: payments?.[0] ? Object.keys(payments[0]) : [] },
        })

        // TEST 5: Insert Test Plan
        const testPlan = {
            name: `TEST_PLAN_${Date.now()}`,
            duration_days: 30,
            price: 999,
            is_active: true,
        }

        const { data: insertedPlan, error: insertError } = await supabase
            .from('plans')
            .insert(testPlan)
            .select()
            .single()

        results.tests.push({
            name: 'Insert Plan',
            status: !insertError ? 'PASS' : 'FAIL',
            message: !insertError
                ? `Successfully inserted test plan (id: ${insertedPlan?.id})`
                : `Error: ${insertError.message}`,
            details: insertedPlan ? { id: insertedPlan.id } : undefined,
        })

        // TEST 6: Update Test Plan
        if (insertedPlan) {
            const { data: updatedPlan, error: updateError } = await supabase
                .from('plans')
                .update({ price: 1999 })
                .eq('id', insertedPlan.id)
                .select()
                .single()

            results.tests.push({
                name: 'Update Plan',
                status: !updateError && updatedPlan?.price === 1999 ? 'PASS' : 'FAIL',
                message: !updateError && updatedPlan?.price === 1999
                    ? 'Successfully updated plan'
                    : `Error: ${updateError?.message || 'Price not updated'}`,
            })
        }

        // TEST 7: Delete Test Plan (Cleanup)
        if (insertedPlan) {
            const { error: deleteError } = await supabase
                .from('plans')
                .delete()
                .eq('id', insertedPlan.id)

            results.tests.push({
                name: 'Delete Plan (Cleanup)',
                status: !deleteError ? 'PASS' : 'FAIL',
                message: !deleteError ? 'Successfully deleted test plan' : `Error: ${deleteError.message}`,
            })
        }

        // TEST 8: Calculate Total Revenue
        const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0
        results.tests.push({
            name: 'Calculate Revenue',
            status: 'PASS',
            message: `Total revenue: ₹${totalRevenue}`,
            details: { total: totalRevenue },
        })

        // SUMMARY
        const passed = results.tests.filter(t => t.status === 'PASS').length
        const failed = results.tests.filter(t => t.status === 'FAIL').length

        return NextResponse.json({
            ...results,
            summary: {
                total: results.tests.length,
                passed,
                failed,
                success: failed === 0,
            },
        })
    } catch (err) {
        return NextResponse.json(
            {
                error: 'Connection test failed',
                message: err instanceof Error ? err.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        )
    }
}
