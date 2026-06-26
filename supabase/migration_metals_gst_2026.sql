-- Optional per-metal GST % on jewellery mounting (HSN 7113). NULL = use shop default.
ALTER TABLE metals
  ADD COLUMN IF NOT EXISTS gst_rate_percent DECIMAL(5, 2);

COMMENT ON COLUMN metals.gst_rate_percent IS
  'GST % on jewellery charges for this metal. NULL uses shop-wide jewelry GST default.';

UPDATE metals SET gst_rate_percent = 3
WHERE slug IN ('gold_22k', 'gold_18k', 'gold_14k', 'platinum', 'silver_925', 'panchdhatu', 'panchdhatu_with_gold')
  AND gst_rate_percent IS NULL;
