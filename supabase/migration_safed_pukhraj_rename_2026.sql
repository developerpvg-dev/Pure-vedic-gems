-- Rename White Sapphire vernacular from "Shvet Pukhraj" to "Safed Pukhraj".
-- Slug stays white-sapphire; redirects already target /shop/white-sapphire.
-- Idempotent.

UPDATE public.gem_categories
SET
  sanskrit_name = 'Safed Pukhraj',
  updated_at = NOW()
WHERE slug = 'white-sapphire'
  AND sanskrit_name IS DISTINCT FROM 'Safed Pukhraj';

UPDATE public.product_categories
SET
  name = 'White Sapphire (Safed Pukhraj)',
  seo_title = CASE
    WHEN seo_title IS NULL THEN seo_title
    ELSE REPLACE(seo_title, 'Shvet Pukhraj', 'Safed Pukhraj')
  END,
  seo_description = CASE
    WHEN seo_description IS NULL THEN seo_description
    ELSE REPLACE(seo_description, 'Shvet Pukhraj', 'Safed Pukhraj')
  END,
  legacy_names = (
    SELECT ARRAY(
      SELECT DISTINCT x
      FROM unnest(
        COALESCE(legacy_names, '{}'::text[])
        || ARRAY['White Sapphire', 'Shvet Pukhraj', 'Safed Pukhraj']
      ) AS x
    )
  ),
  updated_at = NOW()
WHERE slug = 'white-sapphire'
  AND (
    name IS DISTINCT FROM 'White Sapphire (Safed Pukhraj)'
    OR COALESCE(seo_title, '') LIKE '%Shvet Pukhraj%'
    OR COALESCE(seo_description, '') LIKE '%Shvet Pukhraj%'
  );

UPDATE public.shop_category_pages
SET
  sanskrit_name = 'Safed Pukhraj',
  seo_title = CASE WHEN seo_title IS NULL THEN NULL ELSE REPLACE(seo_title, 'Shvet Pukhraj', 'Safed Pukhraj') END,
  seo_description = CASE WHEN seo_description IS NULL THEN NULL ELSE REPLACE(seo_description, 'Shvet Pukhraj', 'Safed Pukhraj') END,
  intro_text = CASE WHEN intro_text IS NULL THEN NULL ELSE REPLACE(intro_text, 'Shvet Pukhraj', 'Safed Pukhraj') END,
  about_html = CASE WHEN about_html IS NULL THEN NULL ELSE REPLACE(about_html, 'Shvet Pukhraj', 'Safed Pukhraj') END,
  how_to_wear_html = CASE WHEN how_to_wear_html IS NULL THEN NULL ELSE REPLACE(how_to_wear_html, 'Shvet Pukhraj', 'Safed Pukhraj') END,
  who_should_wear_html = CASE WHEN who_should_wear_html IS NULL THEN NULL ELSE REPLACE(who_should_wear_html, 'Shvet Pukhraj', 'Safed Pukhraj') END,
  benefits_html = CASE WHEN benefits_html IS NULL THEN NULL ELSE REPLACE(benefits_html, 'Shvet Pukhraj', 'Safed Pukhraj') END,
  types_html = CASE WHEN types_html IS NULL THEN NULL ELSE REPLACE(types_html, 'Shvet Pukhraj', 'Safed Pukhraj') END,
  quality_price_html = CASE WHEN quality_price_html IS NULL THEN NULL ELSE REPLACE(quality_price_html, 'Shvet Pukhraj', 'Safed Pukhraj') END,
  jewellery_html = CASE WHEN jewellery_html IS NULL THEN NULL ELSE REPLACE(jewellery_html, 'Shvet Pukhraj', 'Safed Pukhraj') END,
  cleaning_care_html = CASE WHEN cleaning_care_html IS NULL THEN NULL ELSE REPLACE(cleaning_care_html, 'Shvet Pukhraj', 'Safed Pukhraj') END,
  buyer_beware_html = CASE WHEN buyer_beware_html IS NULL THEN NULL ELSE REPLACE(buyer_beware_html, 'Shvet Pukhraj', 'Safed Pukhraj') END,
  meta_keywords = CASE
    WHEN meta_keywords IS NULL THEN meta_keywords
    ELSE ARRAY(
      SELECT DISTINCT REPLACE(LOWER(k), 'shvet pukhraj', 'safed pukhraj')
      FROM unnest(meta_keywords) AS k
    )
  END,
  faqs = CASE
    WHEN faqs IS NULL THEN faqs
    ELSE REPLACE(faqs::text, 'Shvet Pukhraj', 'Safed Pukhraj')::jsonb
  END,
  updated_at = NOW()
WHERE slug = 'white-sapphire'
  AND (
    sanskrit_name IS DISTINCT FROM 'Safed Pukhraj'
    OR COALESCE(seo_title, '') LIKE '%Shvet Pukhraj%'
    OR COALESCE(seo_description, '') LIKE '%Shvet Pukhraj%'
    OR COALESCE(intro_text, '') LIKE '%Shvet Pukhraj%'
    OR COALESCE(about_html, '') LIKE '%Shvet Pukhraj%'
    OR COALESCE(faqs::text, '') LIKE '%Shvet Pukhraj%'
    OR EXISTS (
      SELECT 1 FROM unnest(COALESCE(meta_keywords, '{}'::text[])) AS k
      WHERE LOWER(k) LIKE '%shvet%pukhraj%'
    )
  );

UPDATE public.products
SET
  hindi_name = 'Safed Pukhraj',
  updated_at = NOW()
WHERE sub_category = 'white-sapphire'
  AND hindi_name ILIKE '%shvet%pukhraj%';
