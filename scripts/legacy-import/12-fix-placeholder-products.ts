/**
 * Assign WooCommerce placeholder image to legacy products with no featured image.
 *   npx tsx scripts/legacy-import/12-fix-placeholder-products.ts --write --write-prod
 */
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const PLACEHOLDER_URL = 'https://www.purevedicgems.in/wp-content/uploads/woocommerce-placeholder-300x300.png';
const MEDIA_BUCKET = process.env.MEDIA_BUCKET ?? 'product-images';

function parseFlags(argv: string[]) {
  return { write: argv.includes('--write'), writeProd: argv.includes('--write-prod') };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  if (write && !writeProd && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod.`);
  }
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL_PRODUCTION || process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('Missing database URL');
  assertSafeTarget(dbUrl, flags.write, flags.writeProd);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const { rows: products } = await client.query<{ id: string; slug: string; legacy_woo_id: string }>(`
      SELECT id, slug, legacy_woo_id::text
        FROM products
       WHERE is_active = true
         AND legacy_woo_id IS NOT NULL
         AND (thumbnail_url IS NULL OR thumbnail_url = '' OR images = '[]'::jsonb)
    `);
    console.log(`Products needing placeholder: ${products.length}`);
    if (products.length === 0 || !flags.write) return;

    const supaUrl = process.env.LEGACY_IMPORT_SUPABASE_URL;
    const supaKey = process.env.LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY;
    if (!supaUrl || !supaKey) throw new Error('Missing Supabase credentials');

    const existing = await client.query(
      `SELECT public_url FROM legacy_import.stg_media_url_map WHERE legacy_url = $1 AND download_status = 'ok' LIMIT 1`,
      [PLACEHOLDER_URL],
    );
    let publicUrl = existing.rows[0]?.public_url as string | undefined;

    if (!publicUrl) {
      const res = await fetch(PLACEHOLDER_URL);
      if (!res.ok) throw new Error(`Failed to fetch placeholder: ${res.status}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      const sha = createHash('sha256').update(bytes).digest('hex');
      const webp = await sharp(bytes).webp({ quality: 82 }).toBuffer();
      const key = `legacy/${sha.slice(0, 2)}/${sha}.webp`;
      const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(key, webp, { contentType: 'image/webp', upsert: true });
      if (error) throw error;
      const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(key);
      publicUrl = pub.publicUrl;
      await client.query(
        `INSERT INTO legacy_import.stg_media_url_map (legacy_url, public_url, storage_bucket, storage_path, download_status, sha256, bytes, mime_type)
         VALUES ($1,$2,$3,$4,'ok',$5,$6,'image/webp')
         ON CONFLICT (legacy_url) DO UPDATE SET public_url = EXCLUDED.public_url, download_status = 'ok'`,
        [PLACEHOLDER_URL, publicUrl, MEDIA_BUCKET, key, sha, webp.byteLength],
      );
    }

    for (const product of products) {
      await client.query(
        `UPDATE products SET thumbnail_url = $2, images = $3::jsonb, updated_at = NOW() WHERE id = $1`,
        [product.id, publicUrl, JSON.stringify([publicUrl])],
      );
      console.log(`  updated ${product.slug}`);
    }
    console.log('Done.');
  } finally {
    await client.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
