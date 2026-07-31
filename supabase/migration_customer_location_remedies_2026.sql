-- Customer current location for remedies recommendation (₹101) + CRM leads.
-- Distinct from birth_place (natal chart) and ip_location (auto geo).
-- Idempotent.

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS customer_city VARCHAR(120),
  ADD COLUMN IF NOT EXISTS customer_state VARCHAR(120),
  ADD COLUMN IF NOT EXISTS customer_country VARCHAR(120);

ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS customer_city VARCHAR(120),
  ADD COLUMN IF NOT EXISTS customer_state VARCHAR(120),
  ADD COLUMN IF NOT EXISTS customer_country VARCHAR(120);
