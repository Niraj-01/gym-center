-- ============================================
-- Migration: Add performance indexes on core tables
-- Created: 2026-02-25
-- Purpose: Speed up common dashboard and listing queries
-- ============================================

-- Members: frequently sorted/filtered by expiry date (dashboard stats, member lists)
CREATE INDEX IF NOT EXISTS idx_members_expiry_date ON members(expiry_date DESC);

-- Members: phone lookups (member portal login, search)
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);

-- Payments: frequently sorted by date (recent payments, reports)
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date DESC);

-- Payments: lookups by member (payment history per member)
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);

-- Payments: lookups by plan (revenue reports per plan)
CREATE INDEX IF NOT EXISTS idx_payments_plan_id ON payments(plan_id);
