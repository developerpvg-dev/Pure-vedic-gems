-- Week 21: Country-based shipping countries and paid shipping plans.

CREATE TABLE IF NOT EXISTS shipping_countries (
  code CHAR(2) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  requires_indian_pincode BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS country_code CHAR(2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shipping_methods_country_code_fkey'
  ) THEN
    ALTER TABLE shipping_methods
      ADD CONSTRAINT shipping_methods_country_code_fkey
      FOREIGN KEY (country_code) REFERENCES shipping_countries(code)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

DROP TRIGGER IF EXISTS shipping_countries_updated_at ON shipping_countries;
CREATE TRIGGER shipping_countries_updated_at
  BEFORE UPDATE ON shipping_countries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Retire legacy free / hard-coded methods.
UPDATE shipping_methods SET is_active = FALSE, updated_at = NOW()
WHERE id IN ('standard', 'express', 'same_day') OR cost <= 0;

INSERT INTO shipping_countries (code, name, requires_indian_pincode, sort_order)
VALUES
  ('IN', 'India', TRUE, 10),
  ('US', 'United States', FALSE, 20),
  ('GB', 'United Kingdom', FALSE, 30),
  ('AE', 'United Arab Emirates', FALSE, 40),
  ('AU', 'Australia', FALSE, 50),
  ('SG', 'Singapore', FALSE, 60),
  ('CA', 'Canada', FALSE, 70),
  ('DE', 'Germany', FALSE, 80)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  requires_indian_pincode = EXCLUDED.requires_indian_pincode,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE,
  updated_at = NOW();

-- India plans
INSERT INTO shipping_methods (
  id, label, description, cost, free_above, estimated_days_min, estimated_days_max,
  zones, country_code, is_active, sort_order
) VALUES
  (
    'in_standard_insured',
    'Standard Insured Delivery (5-7 business days)',
    'Fully insured domestic dispatch across India.',
    199, NULL, 5, 7, ARRAY['IN']::TEXT[], 'IN', TRUE, 10
  ),
  (
    'in_express_insured',
    'Express Insured Delivery (2-3 business days)',
    'Priority insured dispatch for eligible serviceable pin codes.',
    450, NULL, 2, 3, ARRAY['IN']::TEXT[], 'IN', TRUE, 20
  ),
  (
    'in_priority_ncr',
    'Priority Dispatch (1-2 business days, metro/NCR)',
    'Hand delivery or premium courier after manual serviceability check.',
    799, NULL, 1, 2, ARRAY['IN']::TEXT[], 'IN', TRUE, 30
  ),
  -- United States
  (
    'us_standard_intl',
    'International Standard (10-14 business days)',
    'Tracked international shipment with export documentation.',
    3500, NULL, 10, 14, ARRAY['US']::TEXT[], 'US', TRUE, 10
  ),
  (
    'us_express_intl',
    'International Express (5-7 business days)',
    'Express international courier with full tracking.',
    6500, NULL, 5, 7, ARRAY['US']::TEXT[], 'US', TRUE, 20
  ),
  -- United Kingdom
  (
    'gb_standard_intl',
    'International Standard (8-12 business days)',
    'Tracked shipment to the United Kingdom.',
    3200, NULL, 8, 12, ARRAY['GB']::TEXT[], 'GB', TRUE, 10
  ),
  (
    'gb_express_intl',
    'International Express (4-6 business days)',
    'Priority courier service to the United Kingdom.',
    5800, NULL, 4, 6, ARRAY['GB']::TEXT[], 'GB', TRUE, 20
  ),
  -- UAE
  (
    'ae_standard_intl',
    'GCC Standard Delivery (6-9 business days)',
    'Insured shipment within the UAE and GCC corridor.',
    2800, NULL, 6, 9, ARRAY['AE']::TEXT[], 'AE', TRUE, 10
  ),
  (
    'ae_express_intl',
    'GCC Express Delivery (3-5 business days)',
    'Express insured delivery to the UAE.',
    4900, NULL, 3, 5, ARRAY['AE']::TEXT[], 'AE', TRUE, 20
  ),
  -- Australia
  (
    'au_standard_intl',
    'International Standard (12-16 business days)',
    'Tracked delivery to Australia.',
    3900, NULL, 12, 16, ARRAY['AU']::TEXT[], 'AU', TRUE, 10
  ),
  -- Singapore
  (
    'sg_standard_intl',
    'International Standard (7-10 business days)',
    'Tracked delivery to Singapore.',
    2600, NULL, 7, 10, ARRAY['SG']::TEXT[], 'SG', TRUE, 10
  ),
  -- Canada
  (
    'ca_standard_intl',
    'International Standard (10-14 business days)',
    'Tracked delivery to Canada.',
    3600, NULL, 10, 14, ARRAY['CA']::TEXT[], 'CA', TRUE, 10
  ),
  -- Germany (EU)
  (
    'de_standard_intl',
    'EU Standard Delivery (8-12 business days)',
    'Tracked delivery within the European Union.',
    3400, NULL, 8, 12, ARRAY['DE']::TEXT[], 'DE', TRUE, 10
  )
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  cost = EXCLUDED.cost,
  free_above = NULL,
  estimated_days_min = EXCLUDED.estimated_days_min,
  estimated_days_max = EXCLUDED.estimated_days_max,
  zones = EXCLUDED.zones,
  country_code = EXCLUDED.country_code,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

ALTER TABLE shipping_countries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reads active shipping countries" ON shipping_countries;
CREATE POLICY "Public reads active shipping countries" ON shipping_countries
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin manages shipping countries" ON shipping_countries;
CREATE POLICY "Admin manages shipping countries" ON shipping_countries
  FOR ALL USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = TRUE));
