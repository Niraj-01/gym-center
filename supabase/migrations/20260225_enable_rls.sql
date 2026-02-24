-- ============================================
-- Migration: Enable Row Level Security on ALL tables
-- Created: 2026-02-25
-- Purpose: Lock down all public tables to authenticated users only
-- ============================================

-- Enable RLS on every public table
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanned_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE register_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ocr_quota ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policies: Authenticated users get full CRUD
-- Pattern: Admin app — all logged-in users can manage all data
-- ============================================

-- members
CREATE POLICY "auth_full_access" ON members
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- payments
CREATE POLICY "auth_full_access" ON payments
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- plans
CREATE POLICY "auth_full_access" ON plans
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- scanned_documents
CREATE POLICY "auth_full_access" ON scanned_documents
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- register_entries
CREATE POLICY "auth_full_access" ON register_entries
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ocr_processing_logs
CREATE POLICY "auth_full_access" ON ocr_processing_logs
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ocr_usage_logs
CREATE POLICY "auth_full_access" ON ocr_usage_logs
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- user_ocr_quota
CREATE POLICY "auth_full_access" ON user_ocr_quota
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- Verification query (run after applying):
-- Should return ZERO rows if all tables are protected
-- ============================================
-- SELECT tablename FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename NOT IN (
--   SELECT DISTINCT tablename FROM pg_policies
-- );
