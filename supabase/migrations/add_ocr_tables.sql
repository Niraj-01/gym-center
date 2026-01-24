-- Migration: Add OCR tables for GymCentre Member Scanner
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. Add OCR columns to existing members table
-- =====================================================
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS ocr_scanned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS document_image_url TEXT,
ADD COLUMN IF NOT EXISTS ocr_confidence_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);

-- =====================================================
-- 2. Create OCR usage tracking table
-- =====================================================
CREATE TABLE IF NOT EXISTS ocr_usage_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confidence_score DECIMAL(3,2),
  processing_time_ms INTEGER,
  document_type VARCHAR(50),
  fields_extracted INTEGER,
  status VARCHAR(20) CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  raw_text_length INTEGER
);

-- =====================================================
-- 3. Create monthly quota tracking table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_ocr_quota (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'starter',
  monthly_limit INTEGER DEFAULT 50,
  current_usage INTEGER DEFAULT 0,
  month_year VARCHAR(7) NOT NULL,
  reset_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, month_year)
);

-- =====================================================
-- 4. Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ocr_logs_user_timestamp 
  ON ocr_usage_logs(user_id, timestamp DESC);
  
CREATE INDEX IF NOT EXISTS idx_ocr_quota_user_month 
  ON user_ocr_quota(user_id, month_year);
  
CREATE INDEX IF NOT EXISTS idx_members_ocr_scanned 
  ON members(ocr_scanned) WHERE ocr_scanned = true;

-- =====================================================
-- 5. Function to get/create current month quota
-- =====================================================
CREATE OR REPLACE FUNCTION get_or_create_quota(p_user_id TEXT)
RETURNS TABLE(
  current_usage INTEGER, 
  monthly_limit INTEGER, 
  tier VARCHAR(50)
) AS $$
DECLARE
  v_month VARCHAR(7) := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  v_tier VARCHAR(50) := 'starter';
  v_limit INTEGER := 50;
BEGIN
  -- Set limit based on tier (can be extended for different tiers)
  -- For now, using starter tier with 50 scans/month
  
  -- Insert or update quota record
  INSERT INTO user_ocr_quota (user_id, month_year, subscription_tier, monthly_limit)
  VALUES (p_user_id, v_month, v_tier, v_limit)
  ON CONFLICT (user_id, month_year) 
  DO UPDATE SET 
    updated_at = NOW();
  
  -- Return current usage and limit
  RETURN QUERY
  SELECT uoq.current_usage, uoq.monthly_limit, uoq.subscription_tier
  FROM user_ocr_quota uoq
  WHERE uoq.user_id = p_user_id AND uoq.month_year = v_month;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Function to increment usage
-- =====================================================
CREATE OR REPLACE FUNCTION increment_ocr_usage(p_user_id TEXT)
RETURNS void AS $$
DECLARE
  v_month VARCHAR(7) := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
BEGIN
  UPDATE user_ocr_quota 
  SET current_usage = current_usage + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id AND month_year = v_month;
END;
$$ LANGUAGE plpgsql;
