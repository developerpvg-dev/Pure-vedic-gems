-- Link paid bookings into the enquiry CRM (same pipeline for Rs 101 leads + detailed consultations)
BEGIN;

ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS consultation_id UUID UNIQUE REFERENCES consultations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_enquiries_consultation_id
  ON enquiries (consultation_id)
  WHERE consultation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enquiries_enquiry_type
  ON enquiries (enquiry_type, created_at DESC);

COMMIT;
