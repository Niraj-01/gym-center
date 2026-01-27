-- ============================================
-- Dashboard Stats RPC Function
-- ============================================
-- This PostgreSQL function returns all dashboard statistics in a single call,
-- reducing network round trips and improving performance.
--
-- To install: Run this SQL in your Supabase SQL Editor
-- ============================================

-- First, drop the function if it exists (for updates)
DROP FUNCTION IF EXISTS get_dashboard_stats();

-- Create the function
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    total_members INTEGER;
    active_members INTEGER;
    due_soon_members INTEGER;
    expired_members INTEGER;
    this_month_revenue NUMERIC;
    total_revenue NUMERIC;
    now_ts TIMESTAMP WITH TIME ZONE;
    seven_days_later TIMESTAMP WITH TIME ZONE;
    month_start DATE;
BEGIN
    -- Set timestamps
    now_ts := NOW();
    seven_days_later := now_ts + INTERVAL '7 days';
    month_start := DATE_TRUNC('month', now_ts)::DATE;

    -- Get member counts by status
    SELECT 
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (WHERE expiry_date > seven_days_later)::INTEGER,
        COUNT(*) FILTER (WHERE expiry_date >= now_ts AND expiry_date <= seven_days_later)::INTEGER,
        COUNT(*) FILTER (WHERE expiry_date < now_ts)::INTEGER
    INTO 
        total_members,
        active_members,
        due_soon_members,
        expired_members
    FROM members;

    -- Get revenue stats
    SELECT 
        COALESCE(SUM(amount) FILTER (WHERE payment_date >= month_start), 0)::NUMERIC,
        COALESCE(SUM(amount), 0)::NUMERIC
    INTO 
        this_month_revenue,
        total_revenue
    FROM payments;

    -- Build result JSON
    result := json_build_object(
        'total_members', total_members,
        'active_members', active_members,
        'due_soon_members', due_soon_members,
        'expired_members', expired_members,
        'this_month_revenue', this_month_revenue,
        'total_revenue', total_revenue
    );

    RETURN result;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO anon;

-- ============================================
-- Recent Payments RPC Function
-- ============================================
-- Returns recent payments with member and plan info joined

DROP FUNCTION IF EXISTS get_recent_payments(INTEGER);

CREATE OR REPLACE FUNCTION get_recent_payments(limit_count INTEGER DEFAULT 10)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(payment_data)
    INTO result
    FROM (
        SELECT 
            p.id,
            p.member_id,
            m.name as member_name,
            m.phone as member_phone,
            p.amount,
            p.payment_date,
            p.mode as payment_mode,
            p.plan_id,
            pl.name as plan_name,
            p.notes
        FROM payments p
        LEFT JOIN members m ON p.member_id = m.id
        LEFT JOIN plans pl ON p.plan_id = pl.id
        ORDER BY p.payment_date DESC
        LIMIT limit_count
    ) as payment_data;

    RETURN COALESCE(result, '[]'::JSON);
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_recent_payments(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_payments(INTEGER) TO anon;

-- ============================================
-- Combined Dashboard Data RPC Function
-- ============================================
-- Returns all dashboard data in one call

DROP FUNCTION IF EXISTS get_dashboard_data();

CREATE OR REPLACE FUNCTION get_dashboard_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stats JSON;
    payments JSON;
    result JSON;
BEGIN
    -- Get stats
    stats := get_dashboard_stats();
    
    -- Get recent payments
    payments := get_recent_payments(10);
    
    -- Combine into single response
    result := json_build_object(
        'stats', stats,
        'recent_payments', payments
    );

    RETURN result;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_data() TO anon;
