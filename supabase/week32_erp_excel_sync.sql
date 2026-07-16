-- PureVedicGems — category-scoped Excel stock sync

BEGIN;

ALTER TABLE erp_tag_stock
  ADD COLUMN IF NOT EXISTS stock_category TEXT;

CREATE INDEX IF NOT EXISTS idx_erp_tag_stock_category
  ON erp_tag_stock(stock_category);

ALTER TABLE erp_sync_state
  ADD COLUMN IF NOT EXISTS last_sync_mode TEXT;

COMMIT;
