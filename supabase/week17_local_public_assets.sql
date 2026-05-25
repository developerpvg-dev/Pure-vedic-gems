-- ============================================================================
-- Week 17: Local public assets for legacy content pages
-- Rewrites existing seeded certificate rows so public pages do not depend on
-- purevedicgems.com WordPress media after the old site is replaced.
-- ============================================================================

BEGIN;

WITH assets(slug, asset_path) AS (
  VALUES
    ('grs-international-swiss-lab', '/legacy/lab-certificates/grs-international-swiss-lab.jpg'),
    ('gii-govt-lab-gjepc-mumbai', '/legacy/lab-certificates/gii-govt-lab-gjepc-mumbai.jpg'),
    ('iigj-govt-lab-gjepc-delhi', '/legacy/lab-certificates/iigj-govt-lab-gjepc-delhi.jpg'),
    ('rudraksha-certificate', '/legacy/lab-certificates/rudraksha-certificate.jpg'),
    ('iigj-govt-lab-gjepc-jaipur', '/legacy/lab-certificates/iigj-govt-lab-gjepc-jaipur.jpg'),
    ('igi-international-gemological-institute-india-jaipur-mumbai', '/legacy/lab-certificates/igi-india-jaipur-mumbai.jpg'),
    ('igi-international-gemological-institute-india-jaipur-mumbai-2', '/legacy/lab-certificates/igi-india-jaipur-mumbai-2.jpg'),
    ('igi-gtl-certificate-delhi', '/legacy/lab-certificates/igi-gtl-certificate-delhi.jpg'),
    ('gia-gemological-institute-of-america', '/legacy/lab-certificates/gia-gemological-institute-of-america.jpg')
)
UPDATE lab_certificates
SET certificate_url = assets.asset_path,
    thumbnail_url = assets.asset_path,
    updated_at = NOW()
FROM assets
WHERE lab_certificates.slug = assets.slug;

COMMIT;