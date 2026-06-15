-- Add scheduled_at and is_sent columns to client_document_requests
ALTER TABLE client_document_requests ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE client_document_requests ADD COLUMN IF NOT EXISTS is_sent BOOLEAN DEFAULT TRUE;

-- Create index on scheduled_at and is_sent for fast polling
CREATE INDEX IF NOT EXISTS idx_doc_requests_scheduled ON client_document_requests(is_sent, scheduled_at);
