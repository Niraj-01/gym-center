-- Migration: Add UPI ID column to members table
-- Purpose: Store member UPI IDs for payment collection

-- Add UPI ID column
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS upi_updated_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN members.upi_id IS 'Member UPI ID for payment collection (e.g., username@paytm)';
COMMENT ON COLUMN members.upi_updated_at IS 'Timestamp when UPI ID was last updated';

-- Create index for searching by UPI ID (optional but useful)
CREATE INDEX IF NOT EXISTS idx_members_upi_id ON members(upi_id) WHERE upi_id IS NOT NULL;
