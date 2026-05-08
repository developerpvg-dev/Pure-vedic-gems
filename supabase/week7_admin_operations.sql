-- PureVedicGems Week 7 Admin Operations Migration
-- RBAC, commerce settings, bulk imports, tracking events, and lifecycle fields.
-- Safe to rerun in development/staging.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------------------------------------
-- Admin lifecycle fields
-- --------------------------------------------------------------------------

ALTER TABLE products ADD COLUMN IF NOT EXISTS curator_note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_import_batch_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier VARCHAR(120);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(40) DEFAULT 'pending';

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_delivery_status_week7_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_delivery_status_week7_check
  CHECK (delivery_status IN ('pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'failed')) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_products_last_import_batch ON products(last_import_batch_id) WHERE last_import_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_admin_search ON products(sku, tag_number, legacy_woo_id, availability_status, is_active);

-- --------------------------------------------------------------------------
-- Commerce settings, currency rates, and manual override controls
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS commerce_settings (
  id VARCHAR(40) PRIMARY KEY DEFAULT 'commerce',
  values JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  currency VARCHAR(3) NOT NULL,
  rate DECIMAL(14,6) NOT NULL,
  manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  source VARCHAR(80) NOT NULL DEFAULT 'manual',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(base_currency, currency)
);

-- Ensure columns exist even if the table was previously created without them
ALTER TABLE commerce_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE commerce_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE currency_rates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE currency_rates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS commerce_settings_updated_at ON commerce_settings;
CREATE TRIGGER commerce_settings_updated_at BEFORE UPDATE ON commerce_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS currency_rates_updated_at ON currency_rates;
CREATE TRIGGER currency_rates_updated_at BEFORE UPDATE ON currency_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- --------------------------------------------------------------------------
-- Bulk import batches and row-level diagnostics
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS product_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'preview',
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  warning_rows INTEGER NOT NULL DEFAULT 0,
  error_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES product_import_batches(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'preview',
  sku VARCHAR(100),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  normalized_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist even if these tables were previously created without them
ALTER TABLE product_import_batches ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE product_import_batches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE product_import_rows ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_import_batches_status ON product_import_batches(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_rows_batch ON product_import_rows(batch_id, row_number);
CREATE INDEX IF NOT EXISTS idx_import_rows_errors ON product_import_rows(batch_id) WHERE errors <> '[]'::jsonb;

DROP TRIGGER IF EXISTS product_import_batches_updated_at ON product_import_batches;
CREATE TRIGGER product_import_batches_updated_at BEFORE UPDATE ON product_import_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- --------------------------------------------------------------------------
-- Public/admin tracking event log
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS order_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(80) NOT NULL,
  carrier VARCHAR(120),
  tracking_number VARCHAR(160),
  tracking_url TEXT,
  location VARCHAR(160),
  note TEXT,
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_customer_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist even if this table was previously created without them
ALTER TABLE order_tracking_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_order_tracking_events_order ON order_tracking_events(order_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_order_tracking_events_visible ON order_tracking_events(order_id, is_customer_visible, event_time DESC);

-- --------------------------------------------------------------------------
-- RLS policies
-- --------------------------------------------------------------------------

ALTER TABLE commerce_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages commerce settings" ON commerce_settings;
CREATE POLICY "Admin manages commerce settings" ON commerce_settings
  FOR ALL USING (auth.uid() IN (SELECT id FROM team_members WHERE is_active = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM team_members WHERE is_active = true));

DROP POLICY IF EXISTS "Admin manages currency rates" ON currency_rates;
CREATE POLICY "Admin manages currency rates" ON currency_rates
  FOR ALL USING (auth.uid() IN (SELECT id FROM team_members WHERE is_active = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM team_members WHERE is_active = true));

DROP POLICY IF EXISTS "Admin manages import batches" ON product_import_batches;
CREATE POLICY "Admin manages import batches" ON product_import_batches
  FOR ALL USING (auth.uid() IN (SELECT id FROM team_members WHERE is_active = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM team_members WHERE is_active = true));

DROP POLICY IF EXISTS "Admin manages import rows" ON product_import_rows;
CREATE POLICY "Admin manages import rows" ON product_import_rows
  FOR ALL USING (auth.uid() IN (SELECT id FROM team_members WHERE is_active = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM team_members WHERE is_active = true));

DROP POLICY IF EXISTS "Admin manages tracking events" ON order_tracking_events;
CREATE POLICY "Admin manages tracking events" ON order_tracking_events
  FOR ALL USING (auth.uid() IN (SELECT id FROM team_members WHERE is_active = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM team_members WHERE is_active = true));

DROP POLICY IF EXISTS "Customers read visible tracking events" ON order_tracking_events;
CREATE POLICY "Customers read visible tracking events" ON order_tracking_events
  FOR SELECT USING (
    is_customer_visible = true
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_tracking_events.order_id
        AND orders.customer_id = auth.uid()
    )
  );

COMMIT;