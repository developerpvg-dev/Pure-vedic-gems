-- Storefront lab logo badges (admin-managed; shown on product cards only when assigned)

CREATE TABLE IF NOT EXISTS public.storefront_lab_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS storefront_lab_logos_active_sort_idx
  ON public.storefront_lab_logos (is_active, sort_order, name);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS lab_logo_id uuid REFERENCES public.storefront_lab_logos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS products_lab_logo_id_idx
  ON public.products (lab_logo_id)
  WHERE lab_logo_id IS NOT NULL;

ALTER TABLE public.storefront_lab_logos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active storefront lab logos" ON public.storefront_lab_logos;
CREATE POLICY "Public read active storefront lab logos"
  ON public.storefront_lab_logos
  FOR SELECT
  USING (is_active = true);

-- Seed from existing public/labslogo assets (skip if name already present)
INSERT INTO public.storefront_lab_logos (name, image_url, sort_order)
SELECT v.name, v.image_url, v.sort_order
FROM (VALUES
  ('GIA', '/labslogo/GIA.webp', 10),
  ('IGI', '/labslogo/IGI.webp', 20),
  ('GRS', '/labslogo/GRS.webp', 30),
  ('Gübelin', '/labslogo/GUBELIN.webp', 40),
  ('GII', '/labslogo/GII.webp', 50),
  ('IIGJ', '/labslogo/IIGJ.webp', 60),
  ('HRD Antwerp', '/labslogo/HRD ANTWERP.webp', 70),
  ('GJEPC', '/labslogo/GJEPC.webp', 80),
  ('SSEF', '/labslogo/SSEF.webp', 90),
  ('GFCO', '/labslogo/GFCO.webp', 100)
) AS v(name, image_url, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.storefront_lab_logos existing WHERE existing.name = v.name
);
