/**
 * Upsert jewelry + default cert/energization allow-lists for a gem product.
 * Gap-fill omitted product_option_rules; without allow-list IDs the configurator
 * hides Certification + Energization (steps 6–7).
 */
import type { Client } from 'pg';
import { DEFAULT_GEMSTONE_CERT_LAB_SLUGS } from '../../../src/lib/utils/legacy-certificate-options.js';
import { DEFAULT_GEMSTONE_ENERGIZATION_SLUGS } from '../../../src/lib/utils/legacy-energization-options.js';

const GEM_SETTING_TYPES = ['ring', 'pendant', 'bracelet', 'loose'];
const RING_SYSTEMS = ['india', 'us', 'uk_au', 'eu'];

let cachedDefaults: { certIds: string[]; energIds: string[] } | null = null;

async function defaultAllowListIds(client: Client) {
  if (cachedDefaults) return cachedDefaults;

  const [labs, energ] = await Promise.all([
    client.query<{ id: string; legacy_slug: string | null }>(
      `SELECT id::text AS id, legacy_slug FROM certification_labs WHERE is_active = true AND legacy_slug IS NOT NULL`,
    ),
    client.query<{ id: string; legacy_slug: string | null }>(
      `SELECT id::text AS id, legacy_slug FROM energization_options WHERE is_active = true AND legacy_slug IS NOT NULL`,
    ),
  ]);

  const labsBySlug = new Map(labs.rows.map((r) => [String(r.legacy_slug), r.id]));
  const energBySlug = new Map(energ.rows.map((r) => [String(r.legacy_slug), r.id]));

  cachedDefaults = {
    certIds: DEFAULT_GEMSTONE_CERT_LAB_SLUGS.map((s) => labsBySlug.get(s)).filter(
      (id): id is string => Boolean(id),
    ),
    energIds: DEFAULT_GEMSTONE_ENERGIZATION_SLUGS.map((s) => energBySlug.get(s)).filter(
      (id): id is string => Boolean(id),
    ),
  };
  return cachedDefaults;
}

export async function ensureGemConfiguratorOptionRules(
  client: Client,
  productId: string,
  opts?: { certificateEnabled?: boolean; energizationEnabled?: boolean },
) {
  const certificateEnabled = opts?.certificateEnabled ?? true;
  const energizationEnabled = opts?.energizationEnabled ?? true;
  const { certIds, energIds } = await defaultAllowListIds(client);

  await client.query(
    `INSERT INTO public.product_option_rules (
       product_id, certificate_enabled, energization_enabled,
       jewelry_design_enabled, metal_enabled, ring_size_enabled,
       allowed_setting_types, allowed_ring_size_systems,
       allowed_certification_lab_ids, allowed_energization_option_ids
     ) VALUES (
       $1, $2, $3, TRUE, TRUE, TRUE, $4::text[], $5::text[], $6::uuid[], $7::uuid[]
     )
     ON CONFLICT (product_id) DO UPDATE SET
       certificate_enabled = EXCLUDED.certificate_enabled OR product_option_rules.certificate_enabled,
       energization_enabled = EXCLUDED.energization_enabled OR product_option_rules.energization_enabled,
       jewelry_design_enabled = TRUE,
       metal_enabled = TRUE,
       ring_size_enabled = TRUE,
       allowed_setting_types = CASE
         WHEN cardinality(product_option_rules.allowed_setting_types) = 0
           OR product_option_rules.allowed_setting_types = ARRAY['loose']::text[]
         THEN EXCLUDED.allowed_setting_types
         ELSE product_option_rules.allowed_setting_types
       END,
       allowed_ring_size_systems = CASE
         WHEN cardinality(product_option_rules.allowed_ring_size_systems) = 0
         THEN EXCLUDED.allowed_ring_size_systems
         ELSE product_option_rules.allowed_ring_size_systems
       END,
       allowed_certification_lab_ids = CASE
         WHEN cardinality(product_option_rules.allowed_certification_lab_ids) = 0
         THEN EXCLUDED.allowed_certification_lab_ids
         ELSE product_option_rules.allowed_certification_lab_ids
       END,
       allowed_energization_option_ids = CASE
         WHEN cardinality(product_option_rules.allowed_energization_option_ids) = 0
         THEN EXCLUDED.allowed_energization_option_ids
         ELSE product_option_rules.allowed_energization_option_ids
       END,
       updated_at = NOW()`,
    [
      productId,
      certificateEnabled,
      energizationEnabled,
      GEM_SETTING_TYPES,
      RING_SYSTEMS,
      certIds,
      energIds,
    ],
  );

  await client.query(
    `UPDATE products SET configurator_enabled = TRUE, updated_at = NOW()
      WHERE id = $1 AND COALESCE(configurator_enabled, FALSE) = FALSE
        AND lower(category) IN ('navaratna', 'upratna', 'uparatna')`,
    [productId],
  );
}

/** Rudraksha pendant flow: cert + energization defaults, pendant + metal, no ring size. */
export async function ensureRudrakshaConfiguratorOptionRules(client: Client, productId: string) {
  const { certIds, energIds } = await defaultAllowListIds(client);

  await client.query(
    `INSERT INTO public.product_option_rules (
       product_id, certificate_enabled, energization_enabled,
       jewelry_design_enabled, metal_enabled, ring_size_enabled,
       allowed_setting_types, allowed_ring_size_systems,
       allowed_certification_lab_ids, allowed_energization_option_ids
     ) VALUES (
       $1, TRUE, TRUE, TRUE, TRUE, FALSE, ARRAY['pendant']::text[], ARRAY[]::text[], $2::uuid[], $3::uuid[]
     )
     ON CONFLICT (product_id) DO UPDATE SET
       certificate_enabled = TRUE,
       energization_enabled = TRUE,
       jewelry_design_enabled = TRUE,
       metal_enabled = TRUE,
       ring_size_enabled = FALSE,
       allowed_setting_types = CASE
         WHEN cardinality(product_option_rules.allowed_setting_types) = 0
           OR product_option_rules.allowed_setting_types = ARRAY['loose']::text[]
         THEN EXCLUDED.allowed_setting_types
         ELSE product_option_rules.allowed_setting_types
       END,
       allowed_certification_lab_ids = CASE
         WHEN cardinality(product_option_rules.allowed_certification_lab_ids) = 0
         THEN EXCLUDED.allowed_certification_lab_ids
         ELSE product_option_rules.allowed_certification_lab_ids
       END,
       allowed_energization_option_ids = CASE
         WHEN cardinality(product_option_rules.allowed_energization_option_ids) = 0
         THEN EXCLUDED.allowed_energization_option_ids
         ELSE product_option_rules.allowed_energization_option_ids
       END,
       updated_at = NOW()`,
    [productId, certIds, energIds],
  );

  await client.query(
    `UPDATE products SET configurator_enabled = TRUE, updated_at = NOW()
      WHERE id = $1 AND COALESCE(configurator_enabled, FALSE) = FALSE
        AND lower(category) = 'rudraksha'`,
    [productId],
  );
}
