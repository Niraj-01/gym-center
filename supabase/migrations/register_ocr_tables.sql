-- Migration: Register OCR Tables for Handwritten Gym Register Digitization
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. Scanned Documents Table (stores uploaded files metadata)
-- =====================================================
CREATE TABLE IF NOT EXISTS scanned_documents (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  storage_url TEXT NOT NULL,
  storage_path TEXT,
  file_type VARCHAR(20) CHECK (file_type IN ('pdf', 'jpg', 'jpeg', 'png')),
  file_size_bytes INTEGER,
  upload_date TIMESTAMP DEFAULT NOW(),
  ocr_status VARCHAR(20) DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
  ocr_started_at TIMESTAMP,
  ocr_completed_at TIMESTAMP,
  ocr_error_message TEXT,
  raw_ocr_response JSONB,
  full_extracted_text TEXT,
  entries_extracted INTEGER DEFAULT 0,
  auto_approved_count INTEGER DEFAULT 0,
  pending_review_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. Register Entries Table (individual extracted records)
-- =====================================================
CREATE TABLE IF NOT EXISTS register_entries (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES scanned_documents(id) ON DELETE CASCADE,
  row_index INTEGER,
  
  -- Extracted fields with confidence scores
  name VARCHAR(255),
  name_confidence DECIMAL(3,2) DEFAULT 0,
  name_original TEXT, -- Original OCR text before cleanup
  
  phone VARCHAR(20),
  phone_confidence DECIMAL(3,2) DEFAULT 0,
  phone_original TEXT,
  
  entry_date DATE,
  date_confidence DECIMAL(3,2) DEFAULT 0,
  date_original TEXT,
  
  amount DECIMAL(10,2),
  amount_confidence DECIMAL(3,2) DEFAULT 0,
  amount_original TEXT,
  
  payment_status VARCHAR(20) CHECK (payment_status IN ('paid', 'unpaid', 'partial', NULL)),
  status_confidence DECIMAL(3,2) DEFAULT 0,
  status_original TEXT,
  
  -- Additional fields that might be present
  notes TEXT,
  
  -- Confidence and review status
  overall_confidence DECIMAL(3,2) DEFAULT 0,
  low_confidence_fields TEXT[], -- Array of field names with low confidence
  requires_review BOOLEAN DEFAULT FALSE,
  review_status VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'skipped')),
  
  -- Verification tracking
  verified_by TEXT,
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Bounding box for row highlighting
  row_bounds_min_y INTEGER,
  row_bounds_max_y INTEGER,
  
  -- Link to member if approved
  member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  payment_id INTEGER, -- Can link to payments table if exists
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. OCR Processing Logs (for retry and debugging)
-- =====================================================
CREATE TABLE IF NOT EXISTS ocr_processing_logs (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES scanned_documents(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  status VARCHAR(20) CHECK (status IN ('started', 'success', 'failed', 'retry')),
  processing_time_ms INTEGER,
  words_detected INTEGER,
  entries_found INTEGER,
  error_type VARCHAR(50),
  error_message TEXT,
  processor_type VARCHAR(50) DEFAULT 'document_ai', -- 'document_ai' or 'vision_api'
  raw_response_size_bytes INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_scanned_docs_status 
  ON scanned_documents(ocr_status);

CREATE INDEX IF NOT EXISTS idx_scanned_docs_created_by 
  ON scanned_documents(created_by);

CREATE INDEX IF NOT EXISTS idx_scanned_docs_upload_date 
  ON scanned_documents(upload_date DESC);

CREATE INDEX IF NOT EXISTS idx_register_entries_document 
  ON register_entries(document_id);

CREATE INDEX IF NOT EXISTS idx_register_entries_review_status 
  ON register_entries(review_status) WHERE requires_review = TRUE;

CREATE INDEX IF NOT EXISTS idx_register_entries_pending 
  ON register_entries(created_at) WHERE review_status = 'pending' AND requires_review = TRUE;

CREATE INDEX IF NOT EXISTS idx_ocr_logs_document 
  ON ocr_processing_logs(document_id, created_at DESC);

-- =====================================================
-- 5. View: Verification Queue
-- =====================================================
CREATE OR REPLACE VIEW verification_queue AS
SELECT 
  re.id,
  re.document_id,
  re.row_index,
  re.name,
  re.name_confidence,
  re.phone,
  re.phone_confidence,
  re.entry_date,
  re.date_confidence,
  re.amount,
  re.amount_confidence,
  re.payment_status,
  re.status_confidence,
  re.overall_confidence,
  re.low_confidence_fields,
  re.requires_review,
  re.review_status,
  re.row_bounds_min_y,
  re.row_bounds_max_y,
  re.created_at,
  sd.storage_url,
  sd.filename,
  sd.original_filename
FROM register_entries re
JOIN scanned_documents sd ON re.document_id = sd.id
WHERE re.review_status = 'pending' AND re.requires_review = TRUE
ORDER BY re.created_at ASC;

-- =====================================================
-- 6. View: Document Processing Summary
-- =====================================================
CREATE OR REPLACE VIEW document_processing_summary AS
SELECT 
  sd.id,
  sd.filename,
  sd.original_filename,
  sd.storage_url,
  sd.ocr_status,
  sd.upload_date,
  sd.entries_extracted,
  sd.auto_approved_count,
  sd.pending_review_count,
  COUNT(CASE WHEN re.review_status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN re.review_status = 'rejected' THEN 1 END) as rejected_count,
  COUNT(CASE WHEN re.review_status = 'pending' THEN 1 END) as still_pending_count,
  AVG(re.overall_confidence) as avg_confidence,
  sd.created_by
FROM scanned_documents sd
LEFT JOIN register_entries re ON sd.id = re.document_id
GROUP BY sd.id
ORDER BY sd.upload_date DESC;

-- =====================================================
-- 7. Function: Update document counts after entry changes
-- =====================================================
CREATE OR REPLACE FUNCTION update_document_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE scanned_documents 
  SET 
    pending_review_count = (
      SELECT COUNT(*) FROM register_entries 
      WHERE document_id = COALESCE(NEW.document_id, OLD.document_id) 
        AND review_status = 'pending' AND requires_review = TRUE
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.document_id, OLD.document_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update counts
DROP TRIGGER IF EXISTS trigger_update_doc_counts ON register_entries;
CREATE TRIGGER trigger_update_doc_counts
AFTER INSERT OR UPDATE OR DELETE ON register_entries
FOR EACH ROW EXECUTE FUNCTION update_document_counts();

-- =====================================================
-- 8. Function: Get next entry in verification queue
-- =====================================================
CREATE OR REPLACE FUNCTION get_next_verification_entry(p_current_id INTEGER DEFAULT NULL)
RETURNS TABLE(
  id INTEGER,
  document_id INTEGER,
  storage_url TEXT,
  name VARCHAR(255),
  name_confidence DECIMAL(3,2),
  phone VARCHAR(20),
  phone_confidence DECIMAL(3,2),
  entry_date DATE,
  date_confidence DECIMAL(3,2),
  amount DECIMAL(10,2),
  amount_confidence DECIMAL(3,2),
  payment_status VARCHAR(20),
  status_confidence DECIMAL(3,2),
  overall_confidence DECIMAL(3,2),
  low_confidence_fields TEXT[],
  row_bounds_min_y INTEGER,
  row_bounds_max_y INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    re.id,
    re.document_id,
    sd.storage_url,
    re.name,
    re.name_confidence,
    re.phone,
    re.phone_confidence,
    re.entry_date,
    re.date_confidence,
    re.amount,
    re.amount_confidence,
    re.payment_status,
    re.status_confidence,
    re.overall_confidence,
    re.low_confidence_fields,
    re.row_bounds_min_y,
    re.row_bounds_max_y
  FROM register_entries re
  JOIN scanned_documents sd ON re.document_id = sd.id
  WHERE re.review_status = 'pending' 
    AND re.requires_review = TRUE
    AND (p_current_id IS NULL OR re.id > p_current_id)
  ORDER BY re.created_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. RLS Policies (if RLS is enabled)
-- =====================================================
-- Note: Uncomment these if you have RLS enabled on your tables

-- ALTER TABLE scanned_documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE register_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ocr_processing_logs ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view their own documents" ON scanned_documents
--   FOR SELECT USING (created_by = auth.jwt() ->> 'email');

-- CREATE POLICY "Users can insert their own documents" ON scanned_documents
--   FOR INSERT WITH CHECK (created_by = auth.jwt() ->> 'email');

-- =====================================================
-- 10. Create storage bucket for register scans
-- =====================================================
-- Run this in Supabase Dashboard > Storage or via API:
-- CREATE BUCKET register_scans PUBLIC;

-- Note: You may need to run this via the Supabase dashboard:
-- 1. Go to Storage
-- 2. Create a new bucket called "register-scans"
-- 3. Set it to public (or configure appropriate policies)
