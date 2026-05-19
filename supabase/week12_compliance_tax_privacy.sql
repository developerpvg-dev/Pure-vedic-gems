-- PureVedicGems Week 12 Compliance, Tax, Privacy, Returns, and Trust Migration
-- Adds repeatable legal/compliance foundations required before launch.
-- Safe to rerun in development/staging.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------------
-- Product tax/legal fields
-- --------------------------------------------------------------------------

ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_exemption_reason TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS legal_disclosure_text TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS return_eligibility VARCHAR(40) NOT NULL DEFAULT 'standard';
ALTER TABLE products ADD COLUMN IF NOT EXISTS return_window_days INTEGER NOT NULL DEFAULT 15;
ALTER TABLE products ADD COLUMN IF NOT EXISTS treatment_disclosure TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS care_instructions TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS high_value_review_required BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_return_eligibility_week12_check;
ALTER TABLE products
  ADD CONSTRAINT products_return_eligibility_week12_check
  CHECK (return_eligibility IN ('standard', 'loose_gemstone', 'custom_jewellery', 'service', 'non_returnable', 'manual_review')) NOT VALID;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_gst_rate_week12_check;
ALTER TABLE products
  ADD CONSTRAINT products_gst_rate_week12_check
  CHECK (gst_rate IS NULL OR (gst_rate >= 0 AND gst_rate <= 28)) NOT VALID;

-- --------------------------------------------------------------------------
-- Order tax, invoice, billing, returns, and compliance fields
-- --------------------------------------------------------------------------

ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_business_name VARCHAR(220);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_gstin VARCHAR(15);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_invoice_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_status VARCHAR(40) NOT NULL DEFAULT 'not_required';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_generated_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_pdf_path TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status VARCHAR(40) NOT NULL DEFAULT 'none';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_status VARCHAR(40) NOT NULL DEFAULT 'none';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS policy_acceptance JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS compliance_flags JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_invoice_status_week12_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_invoice_status_week12_check
  CHECK (invoice_status IN ('not_required', 'pending', 'generated', 'sent', 'void', 'failed')) NOT VALID;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_refund_status_week12_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_refund_status_week12_check
  CHECK (refund_status IN ('none', 'requested', 'approved', 'processing', 'completed', 'rejected', 'partial')) NOT VALID;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_return_status_week12_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_return_status_week12_check
  CHECK (return_status IN ('none', 'requested', 'authorized', 'received', 'inspection', 'approved', 'rejected', 'closed')) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_orders_buyer_gstin ON orders(buyer_gstin) WHERE buyer_gstin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_invoice_status ON orders(invoice_status);
CREATE INDEX IF NOT EXISTS idx_orders_return_status ON orders(return_status);

-- --------------------------------------------------------------------------
-- Configurable tax rules and GST invoice register
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code VARCHAR(80) UNIQUE NOT NULL,
  label VARCHAR(180) NOT NULL,
  hsn_code VARCHAR(20),
  tax_class VARCHAR(100),
  component VARCHAR(60) NOT NULL DEFAULT 'product',
  rate_percent DECIMAL(5,2) NOT NULL CHECK (rate_percent >= 0 AND rate_percent <= 28),
  applies_to_categories TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tax_rules_updated_at ON tax_rules;
CREATE TRIGGER tax_rules_updated_at BEFORE UPDATE ON tax_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO tax_rules (rule_code, label, hsn_code, tax_class, component, rate_percent, applies_to_categories, notes, metadata)
VALUES
  ('loose_gemstone_7103', 'Loose precious and semi-precious stones', '7103', 'loose_gemstone', 'product', 0.25, ARRAY['gemstone','navratna','upratna'], 'Verify final HSN/rate with accountant before production invoicing.', '{"verification_required": true}'::jsonb),
  ('jewellery_7113', 'Gold/silver jewellery and metal value', '7113', 'jewellery', 'product', 3.00, ARRAY['jewelry','jewellery'], 'Common jewellery GST treatment; verify by product composition.', '{"verification_required": true}'::jsonb),
  ('making_charge_service', 'Jewellery making/customisation charges', NULL, 'making_charge', 'making_charge', 5.00, ARRAY[]::TEXT[], 'Service component for making charges; verify by invoice format.', '{"verification_required": true}'::jsonb),
  ('certification_service', 'Certification and lab handling services', NULL, 'certification', 'certification', 18.00, ARRAY[]::TEXT[], 'Service tax component for optional certificates.', '{"verification_required": true}'::jsonb),
  ('energization_service', 'Energization, puja, consultation, and ritual services', NULL, 'service', 'service', 18.00, ARRAY[]::TEXT[], 'Service tax component for spiritual/consultation services.', '{"verification_required": true}'::jsonb),
  ('shipping_service', 'Shipping, insurance, and handling', '9968', 'shipping', 'shipping', 18.00, ARRAY[]::TEXT[], 'Shipping and handling tax treatment must follow final accounting advice.', '{"verification_required": true}'::jsonb)
ON CONFLICT (rule_code) DO UPDATE SET
  label = EXCLUDED.label,
  hsn_code = EXCLUDED.hsn_code,
  tax_class = EXCLUDED.tax_class,
  component = EXCLUDED.component,
  rate_percent = EXCLUDED.rate_percent,
  applies_to_categories = EXCLUDED.applies_to_categories,
  notes = EXCLUDED.notes,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number VARCHAR(40) UNIQUE NOT NULL,
  invoice_type VARCHAR(30) NOT NULL DEFAULT 'tax_invoice',
  seller_legal_name VARCHAR(220) NOT NULL DEFAULT 'Pure Vedic Gems Pvt. Ltd.',
  seller_gstin VARCHAR(15),
  seller_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  buyer_name VARCHAR(220),
  buyer_gstin VARCHAR(15),
  buyer_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  place_of_supply VARCHAR(120),
  hsn_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
  tax_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  pdf_path TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'draft',
  issued_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (invoice_type IN ('tax_invoice', 'bill_of_supply', 'credit_note', 'proforma')),
  CHECK (status IN ('draft', 'issued', 'sent', 'void', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status, created_at DESC);

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- --------------------------------------------------------------------------
-- Returns/RMA, refunds, privacy requests, consent logs, and policy versions
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rma_number VARCHAR(40) UNIQUE NOT NULL DEFAULT ('RMA-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name VARCHAR(220) NOT NULL,
  requester_email VARCHAR(255) NOT NULL,
  requester_phone VARCHAR(30),
  reason_category VARCHAR(60) NOT NULL,
  reason_details TEXT,
  requested_resolution VARCHAR(40) NOT NULL DEFAULT 'refund',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(40) NOT NULL DEFAULT 'requested',
  inspection_notes TEXT,
  courier_name VARCHAR(120),
  tracking_number VARCHAR(160),
  tracking_url TEXT,
  customer_shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (reason_category IN ('not_suitable', 'damaged_in_transit', 'wrong_item', 'certificate_issue', 'quality_concern', 'changed_mind', 'other')),
  CHECK (requested_resolution IN ('refund', 'replacement', 'store_credit', 'repair', 'inspection')),
  CHECK (status IN ('requested', 'authorized', 'customer_shipped', 'received', 'inspection', 'approved', 'rejected', 'refunded', 'replaced', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order ON return_requests(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status, created_at DESC);

DROP TRIGGER IF EXISTS return_requests_updated_at ON return_requests;
CREATE TRIGGER return_requests_updated_at BEFORE UPDATE ON return_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS refund_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  return_request_id UUID REFERENCES return_requests(id) ON DELETE SET NULL,
  provider VARCHAR(40) DEFAULT 'razorpay',
  provider_refund_id VARCHAR(160),
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  refund_type VARCHAR(40) NOT NULL DEFAULT 'full',
  status VARCHAR(40) NOT NULL DEFAULT 'requested',
  reason TEXT,
  gateway_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (refund_type IN ('full', 'partial', 'shipping_only', 'store_credit')),
  CHECK (status IN ('requested', 'approved', 'processing', 'processed', 'failed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_refund_records_order ON refund_records(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_refund_records_status ON refund_records(status, created_at DESC);

DROP TRIGGER IF EXISTS refund_records_updated_at ON refund_records;
CREATE TRIGGER refund_records_updated_at BEFORE UPDATE ON refund_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS privacy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type VARCHAR(40) NOT NULL,
  full_name VARCHAR(220) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  message TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'received',
  verification_status VARCHAR(40) NOT NULL DEFAULT 'pending',
  email_hash TEXT,
  due_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  resolved_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
  internal_notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (request_type IN ('data_export', 'data_deletion', 'data_correction', 'consent_withdrawal', 'marketing_unsubscribe')),
  CHECK (status IN ('received', 'verifying', 'in_progress', 'waiting_on_customer', 'completed', 'rejected', 'cancelled')),
  CHECK (verification_status IN ('pending', 'verified', 'failed', 'not_required'))
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_email_hash ON privacy_requests(email_hash);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON privacy_requests(status, due_at);

DROP TRIGGER IF EXISTS privacy_requests_updated_at ON privacy_requests;
CREATE TRIGGER privacy_requests_updated_at BEFORE UPDATE ON privacy_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_hash TEXT,
  consent_type VARCHAR(60) NOT NULL,
  status VARCHAR(30) NOT NULL,
  policy_version VARCHAR(40),
  source VARCHAR(80) NOT NULL DEFAULT 'website',
  ip_address INET,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (consent_type IN ('cookie_analytics', 'marketing_email', 'whatsapp_updates', 'checkout_terms', 'privacy_policy', 'return_policy')),
  CHECK (status IN ('granted', 'denied', 'withdrawn'))
);

CREATE INDEX IF NOT EXISTS idx_consent_logs_customer ON consent_logs(customer_id, created_at DESC) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consent_logs_email_hash ON consent_logs(email_hash) WHERE email_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consent_logs_type ON consent_logs(consent_type, created_at DESC);

CREATE TABLE IF NOT EXISTS policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_key VARCHAR(80) NOT NULL,
  version VARCHAR(40) NOT NULL,
  title VARCHAR(180) NOT NULL,
  effective_date DATE NOT NULL,
  summary TEXT,
  published_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(policy_key, version)
);

INSERT INTO policy_versions (policy_key, version, title, effective_date, summary, published_url)
VALUES
  ('terms', '2026-05-16', 'Terms and Conditions', '2026-05-16', 'Website, purchase, IP, limitation of liability, and jurisdiction terms.', '/policies/terms'),
  ('privacy', '2026-05-16', 'Privacy Policy', '2026-05-16', 'Personal data, birth details, consent, cookies, and privacy rights workflow.', '/policies/privacy'),
  ('shipping', '2026-05-16', 'Shipping Policy', '2026-05-16', 'Domestic/international insured shipping, customs, delivery, and risk handling.', '/policies/shipping'),
  ('returns', '2026-05-16', 'Returns and Refund Policy', '2026-05-16', '15-day loose gemstone policy, custom jewellery handling, refunds, and RMA process.', '/policies/returns'),
  ('treatment_disclosure', '2026-05-16', 'Treatment Disclosure', '2026-05-16', 'Disclosure rules for natural, treated, heated, enhanced, and certified stones.', '/policies/treatment-disclosure'),
  ('legal_notice', '2026-05-16', 'Anti-Fraud and No-Franchise Notice', '2026-05-16', 'Official branches, trademark ownership, and fraud prevention notice.', '/policies/legal-notice')
ON CONFLICT (policy_key, version) DO UPDATE SET
  title = EXCLUDED.title,
  effective_date = EXCLUDED.effective_date,
  summary = EXCLUDED.summary,
  published_url = EXCLUDED.published_url,
  is_active = TRUE;

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------

ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active tax rules" ON tax_rules;
CREATE POLICY "Public reads active tax rules" ON tax_rules
  FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admin manages tax rules" ON tax_rules;
CREATE POLICY "Admin manages tax rules" ON tax_rules
  FOR ALL USING (auth.uid() IN (SELECT id FROM team_members WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT id FROM team_members WHERE is_active = TRUE));

DROP POLICY IF EXISTS "Customers read own invoices" ON invoices;
CREATE POLICY "Customers read own invoices" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = invoices.order_id
        AND orders.customer_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Admin manages invoices" ON invoices;
CREATE POLICY "Admin manages invoices" ON invoices
  FOR ALL USING (auth.uid() IN (SELECT id FROM team_members WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT id FROM team_members WHERE is_active = TRUE));

DROP POLICY IF EXISTS "Customers read own return requests" ON return_requests;
CREATE POLICY "Customers read own return requests" ON return_requests
  FOR SELECT USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "Admin manages return requests" ON return_requests;
CREATE POLICY "Admin manages return requests" ON return_requests
  FOR ALL USING (auth.uid() IN (SELECT id FROM team_members WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT id FROM team_members WHERE is_active = TRUE));

DROP POLICY IF EXISTS "Admin manages refund records" ON refund_records;
CREATE POLICY "Admin manages refund records" ON refund_records
  FOR ALL USING (auth.uid() IN (SELECT id FROM team_members WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT id FROM team_members WHERE is_active = TRUE));

DROP POLICY IF EXISTS "Admin manages privacy requests" ON privacy_requests;
CREATE POLICY "Admin manages privacy requests" ON privacy_requests
  FOR ALL USING (auth.uid() IN (SELECT id FROM team_members WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT id FROM team_members WHERE is_active = TRUE));

DROP POLICY IF EXISTS "Admin reads consent logs" ON consent_logs;
CREATE POLICY "Admin reads consent logs" ON consent_logs
  FOR SELECT USING (auth.uid() IN (SELECT id FROM team_members WHERE is_active = TRUE));

DROP POLICY IF EXISTS "Public reads active policy versions" ON policy_versions;
CREATE POLICY "Public reads active policy versions" ON policy_versions
  FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admin manages policy versions" ON policy_versions;
CREATE POLICY "Admin manages policy versions" ON policy_versions
  FOR ALL USING (auth.uid() IN (SELECT id FROM team_members WHERE is_active = TRUE))
  WITH CHECK (auth.uid() IN (SELECT id FROM team_members WHERE is_active = TRUE));

COMMIT;