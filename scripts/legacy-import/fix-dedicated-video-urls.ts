/**
 * fix-dedicated-video-urls.ts
 *
 * Background
 * ----------
 * The legacy WooCommerce store stored TWO kinds of YouTube videos:
 *
 *   1. A *generic*, category-level video embedded as an <iframe> inside the
 *      product description (post_content). Our migration extracted this with
 *      `extractLegacyVideoUrl()` and wrote it to `products.video_url`. Because
 *      it is generic, the SAME video is reused across many different products
 *      (e.g. one "Yellow Sapphire" clip shared by dozens of distinct stones).
 *
 *   2. A *dedicated, product-specific* video stored against each gemstone's
 *      gallery image attachment via the ACF meta keys:
 *         video_site   = 'youtube'
 *         videolink_id = '<11-char YouTube id>'
 *      This is the correct, unique video of the actual stone on sale.
 *
 * The storefront product gallery should show video (2), not (1). This script
 * re-points `video_url` to the dedicated per-product video wherever one exists,
 * keeping the description-extracted video only for products that have no
 * dedicated video (e.g. most Rudraksha).
 *
 * It updates BOTH the `legacy_import.stg_<phase>_products` staging table and
 * `public.products` in a single transaction per phase, so the 07-verify G11
 * field-parity gate stays green.
 *
 * Safe by default: dry-run prints the impact; pass --write to commit.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/fix-dedicated-video-urls.ts            (dry-run)
 *   npx tsx scripts/legacy-import/fix-dedicated-video-urls.ts --write
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

interface Phase {
  category: string; // public.products.category value
  stagingTable: string; // legacy_import.<table>
}

const PHASES: Phase[] = [
  { category: 'navaratna', stagingTable: 'stg_navratna_products' },
  { category: 'upratna', stagingTable: 'stg_upratna_products' },
  { category: 'rudraksha', stagingTable: 'stg_rudraksha_products' },
];

/**
 * CTE that resolves the dedicated per-product video id from the FIRST gallery
 * image attachment that carries a `videolink_id`. Returns the canonical embed
 * URL so it matches the format already stored by the migration.
 */
const DEDICATED_VIDEO_CTE = /* sql */ `
  with gallery as (
    select gm.post_id::bigint as product_id, trim(x)::bigint as attach_id, ord
    from legacy_import.stg_wp_postmeta gm,
      unnest(string_to_array(gm.meta_value, ',')) with ordinality as u(x, ord)
    where gm.meta_key = '_product_image_gallery'
      and gm.meta_value ~ '^[0-9,]+$'
  ),
  vlink as (
    select pm.post_id::bigint as attach_id, pm.meta_value as video_id
    from legacy_import.stg_wp_postmeta pm
    join legacy_import.stg_wp_postmeta vs
      on vs.post_id = pm.post_id and vs.meta_key = 'video_site' and vs.meta_value = 'youtube'
    where pm.meta_key = 'videolink_id'
      and pm.meta_value ~ '^[\\w-]{11}$'
  ),
  dedicated as (
    select g.product_id as legacy_woo_id,
      'https://www.youtube.com/embed/'
        || (array_agg(vl.video_id order by g.ord) filter (where vl.video_id is not null))[1]
        as video_url
    from gallery g
    join vlink vl on vl.attach_id = g.attach_id
    group by g.product_id
    having (array_agg(vl.video_id order by g.ord) filter (where vl.video_id is not null))[1] is not null
  )
`;

async function main() {
  const write = process.argv.includes('--write');
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL in env.');

  const host = new URL(dbUrl).hostname;
  console.log(`Mode: ${write ? 'WRITE' : 'DRY-RUN'}`);
  console.log(`Host: ${host}`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await client.query('begin');

    for (const phase of PHASES) {
      // How many would change in public.products for this category.
      const preview = await client.query(
        `${DEDICATED_VIDEO_CTE}
         select count(*)::int as total_with_dedicated,
                count(*) filter (where p.video_url is distinct from d.video_url)::int as needs_change
         from dedicated d
         join public.products p on p.legacy_woo_id = d.legacy_woo_id
         where p.category = $1`,
        [phase.category],
      );
      const { total_with_dedicated, needs_change } = preview.rows[0];
      console.log(
        `\n[${phase.category}] products with a dedicated video: ${total_with_dedicated}, need video_url change: ${needs_change}`,
      );

      // Update staging table.
      const stg = await client.query(
        `${DEDICATED_VIDEO_CTE}
         update legacy_import.${phase.stagingTable} s
         set video_url = d.video_url
         from dedicated d
         where d.legacy_woo_id = s.legacy_woo_id
           and s.video_url is distinct from d.video_url`,
      );

      // Update public catalog.
      const pub = await client.query(
        `${DEDICATED_VIDEO_CTE}
         update public.products p
         set video_url = d.video_url
         from dedicated d
         where d.legacy_woo_id = p.legacy_woo_id
           and p.category = $1
           and p.video_url is distinct from d.video_url`,
        [phase.category],
      );

      console.log(
        `  -> staging rows updated: ${stg.rowCount}, public rows updated: ${pub.rowCount}`,
      );
    }

    // Parity check: staging vs public video_url after the update.
    for (const phase of PHASES) {
      const parity = await client.query(
        `select count(*) filter (where p.video_url is distinct from s.video_url)::int as video_mismatch
         from public.products p
         join legacy_import.${phase.stagingTable} s on s.legacy_woo_id = p.legacy_woo_id
         where p.category = $1`,
        [phase.category],
      );
      console.log(`[${phase.category}] post-update staging<->public video mismatch: ${parity.rows[0].video_mismatch}`);
    }

    if (write) {
      await client.query('commit');
      console.log('\nCOMMITTED.');
    } else {
      await client.query('rollback');
      console.log('\nDRY-RUN rolled back. Re-run with --write to commit.');
    }
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
