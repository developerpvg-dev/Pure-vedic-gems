-- Soft-delete trash for products. Rows with deleted_at set are hidden from
-- catalog/admin lists; permanently removable after 30 days.
-- Idempotent.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS products_deleted_at_idx
  ON public.products (deleted_at)
  WHERE deleted_at IS NOT NULL;
