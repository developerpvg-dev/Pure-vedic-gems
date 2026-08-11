-- Additional contacts for duplicate tracking (telecaller / leads manager).
-- Stored normalized (email lowercased, phone last-10 digits) so matcher queries stay simple.
ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS additional_phones text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS additional_emails text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_enquiries_additional_phones
  ON enquiries USING gin (additional_phones);

CREATE INDEX IF NOT EXISTS idx_enquiries_additional_emails
  ON enquiries USING gin (additional_emails);
