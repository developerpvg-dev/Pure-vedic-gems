-- Per-metal availability flags for jewelry designs (on_request, unavailable)
ALTER TABLE jewelry_designs
  ADD COLUMN IF NOT EXISTS metal_flags JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN jewelry_designs.metal_flags IS
  'Per-metal overrides, e.g. {"platinum":"on_request"}. Absent metals infer from making_charges / estimated_metal_weight.';
