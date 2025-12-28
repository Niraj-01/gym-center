-- Fix plan_id Migration - Correct SQL with Proper JOIN
-- Created: 2025-12-28
-- Purpose: Safely update NULL plan_id values based on legacy plan text field

-- ============================================================================
-- STEP 1: Update plan_id based on legacy plan text field
-- ============================================================================
-- This assumes members table has a 'plan' TEXT column with values like:
-- 'Monthly', 'Quarterly', 'Yearly' that match plans.name

UPDATE members m
SET plan_id = p.id
FROM plans p
WHERE m.plan_id IS NULL
  AND m.plan IS NOT NULL
  AND LOWER(TRIM(m.plan)) = LOWER(TRIM(p.name));

-- This query:
-- ✅ Only updates rows where plan_id is NULL (safe - no overwrites)
-- ✅ Requires both m.plan and p.name to match (semantic correctness)
-- ✅ Uses LOWER() for case-insensitive matching (e.g., "monthly" = "Monthly")
-- ✅ Uses TRIM() to handle whitespace (e.g., " Monthly " = "Monthly")
-- ✅ Preserves data integrity by matching actual plan preference

-- ============================================================================
-- STEP 2 (OPTIONAL): Assign default plan for members with no matching plan
-- ============================================================================
-- Only run this if you want to assign a default plan to members who have
-- no plan text or whose plan text doesn't match any existing plan

-- Uncomment the following if you want to use 'Monthly' as default:

-- UPDATE members m
-- SET plan_id = (SELECT id FROM plans WHERE name = 'Monthly' LIMIT 1)
-- WHERE m.plan_id IS NULL
--   AND EXISTS (SELECT 1 FROM plans WHERE name = 'Monthly');

-- ============================================================================
-- VERIFICATION: Run these queries after migration to validate
-- ============================================================================

-- 1. Check for remaining NULL plan_id (should be 0 or very few)
-- SELECT COUNT(*) as null_plan_count FROM members WHERE plan_id IS NULL;

-- 2. Verify all plan_id values reference actual plans (should be 0)
-- SELECT COUNT(*) FROM members m 
-- LEFT JOIN plans p ON m.plan_id = p.id 
-- WHERE m.plan_id IS NOT NULL AND p.id IS NULL;

-- 3. View members with NULL plan_id for manual review
-- SELECT id, name, email, plan, plan_id FROM members WHERE plan_id IS NULL;

-- 4. Count members per plan (sanity check)
-- SELECT p.name, COUNT(m.id) as member_count
-- FROM plans p
-- LEFT JOIN members m ON m.plan_id = p.id
-- GROUP BY p.id, p.name
-- ORDER BY member_count DESC;
