-- Tanzanite has no Hindi/Vedic alias in nav; "Neeli" belongs to Iolite.
-- Idempotent.

UPDATE public.gem_categories
SET
  sanskrit_name = NULL,
  updated_at = NOW()
WHERE slug = 'tanzanite'
  AND sanskrit_name IS NOT NULL;
