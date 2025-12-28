-- Validation Queries for plan_id Data Integrity
-- Run these queries to verify the migration was successful

-- ============================================================================
-- 1. CHECK FOR NULL plan_id
-- ============================================================================
-- Expected: 0 rows (or only new members not yet assigned a plan)
SELECT 
    id, 
    name, 
    email, 
    plan, 
    plan_id,
    created_at
FROM members 
WHERE plan_id IS NULL
ORDER BY created_at DESC;

-- Quick count:
SELECT COUNT(*) as members_with_null_plan_id 
FROM members 
WHERE plan_id IS NULL;

-- ============================================================================
-- 2. VERIFY REFERENTIAL INTEGRITY
-- ============================================================================
-- Expected: 0 rows (all plan_id must reference actual plans)
SELECT 
    m.id,
    m.name,
    m.email,
    m.plan_id,
    'Plan does not exist' as issue
FROM members m
LEFT JOIN plans p ON m.plan_id = p.id
WHERE m.plan_id IS NOT NULL
  AND p.id IS NULL;

-- ============================================================================
-- 3. DETECT MISMATCHED LEGACY DATA
-- ============================================================================
-- Shows members whose legacy 'plan' text doesn't match any plan.name
-- These may need manual review/correction
SELECT 
    m.id,
    m.name,
    m.plan as legacy_plan_text,
    m.plan_id,
    p.name as assigned_plan_name
FROM members m
LEFT JOIN plans p ON m.plan_id = p.id
WHERE m.plan IS NOT NULL
  AND m.plan NOT IN (SELECT name FROM plans);

-- ============================================================================
-- 4. MEMBER DISTRIBUTION PER PLAN
-- ============================================================================
-- Sanity check: verify distribution looks reasonable
SELECT 
    p.id,
    p.name,
    p.price,
    p.duration,
    COUNT(m.id) as member_count,
    p.is_active
FROM plans p
LEFT JOIN members m ON m.plan_id = p.id
GROUP BY p.id, p.name, p.price, p.duration, p.is_active
ORDER BY member_count DESC;

-- ============================================================================
-- 5. MEMBERS WITH VALID PLANS
-- ============================================================================
-- Shows all members with their plan details (success case)
SELECT 
    m.id,
    m.name,
    m.email,
    p.name as plan_name,
    p.duration as plan_duration_days,
    m.membership_expiry_date,
    CASE 
        WHEN m.membership_expiry_date > NOW() THEN 'Active'
        ELSE 'Expired'
    END as status
FROM members m
INNER JOIN plans p ON m.plan_id = p.id
ORDER BY m.membership_expiry_date DESC
LIMIT 20;

-- ============================================================================
-- 6. SUMMARY STATISTICS
-- ============================================================================
SELECT 
    (SELECT COUNT(*) FROM members) as total_members,
    (SELECT COUNT(*) FROM members WHERE plan_id IS NULL) as members_without_plan,
    (SELECT COUNT(*) FROM members WHERE plan_id IS NOT NULL) as members_with_plan,
    (SELECT COUNT(*) FROM plans) as total_plans,
    (SELECT COUNT(*) FROM plans WHERE is_active = true) as active_plans;
