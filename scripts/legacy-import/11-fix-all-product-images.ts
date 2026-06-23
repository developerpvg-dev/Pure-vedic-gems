/**
 * Re-sync ALL legacy product images from WooCommerce attachment metadata.
 *
 * 1. Enumerate every attachment URL referenced by active legacy products
 *    (_thumbnail_id + _product_image_gallery) into stg_media_url_map (.in + .com).
 * 2. Re-download pending/failed media to Supabase Storage.
 * 3. Rebuild products.thumbnail_url + products.images from the media map.
 *
 * Dry-run by default:
 *   npx tsx scripts/legacy-import/11-fix-all-product-images.ts
 * Apply to production after review:
 *   npx tsx scripts/legacy-import/11-fix-all-product-images.ts --write --write-prod
 */
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import pgTypes from 'pg';
import sharp from 'sharp';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { streamWpTable } from './lib/wp-sql.js';

pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const WOO_DUMP = resolve(repoRoot, '..', 'pugemved_indb', 'pugemved_indb.sql');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const MEDIA_BUCKET = process.env.MEDIA_BUCKET ?? 'product-images';
const LEGACY_BASES = [
  'https://www.purevedicgems.in/wp-content/uploads/',
];
const DOWNLOAD_CONCURRENCY = 1;
const FETCH_TIMEOUT_MS = 30_000;

function parseFlags(argv: string[]) {
  return {
    write: argv.includes('--write'),
    writeProd: argv.includes('--write-prod'),
    skipDownload: argv.includes('--skip-download'),
    skipRebuild: argv.includes('--skip-rebuild'),
  };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  if (write && !writeProd && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod after dry-run review.`);
  }
  return dbHost;
}

function legacyUrlVariants(path: string) {
  return LEGACY_BASES.map((base) => base + path);
}

function parseGalleryIds(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map((v) => Number(v.trim())).filter((n) => Number.isFinite(n) && n > 0);
  }
  return [];
}

async function loadAttachmentPaths(client: Client, attachmentIds: number[]) {
  if (attachmentIds.length === 0) return new Map<number, string>();
  const r = await client.query(
    `SELECT post_id::bigint AS id, meta_value AS path
       FROM legacy_import.stg_wp_postmeta
      WHERE meta_key = '_wp_attached_file' AND post_id = ANY($1::bigint[])`,
    [attachmentIds],
  );
  const map = new Map<number, string>();
  for (const row of r.rows) map.set(Number(row.id), String(row.path));
  return map;
}

async function syncMissingPostmeta(client: Client, write: boolean) {
  console.log('--- Phase 0: sync missing Woo postmeta from dump ---\n');

  const { rows: missingProducts } = await client.query<{ legacy_woo_id: string }>(`
    SELECT p.legacy_woo_id::text
      FROM products p
     WHERE p.legacy_woo_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM legacy_import.stg_wp_postmeta m
          WHERE m.post_id = p.legacy_woo_id AND m.meta_key = '_thumbnail_id'
       )
  `);
  const missingIds = new Set(missingProducts.map((r) => r.legacy_woo_id));
  console.log(`Products without _thumbnail_id in stg_wp_postmeta: ${missingIds.size}`);
  if (missingIds.size === 0) return { synced: 0 };

  const attachmentIds = new Set<string>();
  const rowsToInsert: Array<{ meta_id: string; post_id: string; meta_key: string; meta_value: string }> = [];

  for await (const row of streamWpTable({
    filePath: WOO_DUMP,
    tableName: 'wp_postmeta',
    filter: (r) => {
      const postId = String(r.post_id ?? '');
      const key = String(r.meta_key ?? '');
      return missingIds.has(postId) && (key === '_thumbnail_id' || key === '_product_image_gallery');
    },
  })) {
    const postId = String(row.post_id);
    const key = String(row.meta_key);
    const value = String(row.meta_value ?? '');
    rowsToInsert.push({ meta_id: String(row.meta_id), post_id: postId, meta_key: key, meta_value: value });
    if (key === '_thumbnail_id' && value) attachmentIds.add(value);
    if (key === '_product_image_gallery') {
      for (const id of value.split(',').map((v) => v.trim()).filter(Boolean)) attachmentIds.add(id);
    }
  }

  for await (const row of streamWpTable({
    filePath: WOO_DUMP,
    tableName: 'wp_postmeta',
    filter: (r) => attachmentIds.has(String(r.post_id)) && r.meta_key === '_wp_attached_file',
  })) {
    rowsToInsert.push({
      meta_id: String(row.meta_id),
      post_id: String(row.post_id),
      meta_key: '_wp_attached_file',
      meta_value: String(row.meta_value ?? ''),
    });
  }

  console.log(`Postmeta rows to sync: ${rowsToInsert.length} (attachments: ${attachmentIds.size})`);
  if (!write || rowsToInsert.length === 0) return { synced: rowsToInsert.length };

  for (const row of rowsToInsert) {
    await client.query(
      `INSERT INTO legacy_import.stg_wp_postmeta (meta_id, post_id, meta_key, meta_value)
       VALUES ($1::bigint, $2::bigint, $3, $4)
       ON CONFLICT (meta_id) DO NOTHING`,
      [row.meta_id, row.post_id, row.meta_key, row.meta_value],
    );
  }
  return { synced: rowsToInsert.length };
}

async function enumerateMedia(client: Client, write: boolean) {
  console.log('--- Phase 1: enumerate attachment URLs ---\n');

  const products = await client.query(`
    SELECT p.legacy_woo_id,
           thumb.meta_value AS thumbnail_id,
           gallery.meta_value AS gallery_raw
      FROM products p
      LEFT JOIN legacy_import.stg_wp_postmeta thumb
        ON thumb.post_id = p.legacy_woo_id AND thumb.meta_key = '_thumbnail_id'
      LEFT JOIN legacy_import.stg_wp_postmeta gallery
        ON gallery.post_id = p.legacy_woo_id AND gallery.meta_key = '_product_image_gallery'
     WHERE p.legacy_woo_id IS NOT NULL AND p.is_active = true
  `);

  const attachmentIds = new Set<number>();
  for (const row of products.rows) {
    const tid = Number(row.thumbnail_id);
    if (Number.isFinite(tid) && tid > 0) attachmentIds.add(tid);
    for (const id of parseGalleryIds(row.gallery_raw)) attachmentIds.add(id);
  }
  console.log(`Active legacy products: ${products.rowCount}`);
  console.log(`Distinct attachment IDs: ${attachmentIds.size}`);

  const pathById = await loadAttachmentPaths(client, [...attachmentIds]);
  console.log(`Resolved _wp_attached_file: ${pathById.size}/${attachmentIds.size}`);

  const candidates: Array<{ legacy_url: string; legacy_attachment_id: number }> = [];
  for (const [id, path] of pathById) {
    for (const url of legacyUrlVariants(path)) {
      candidates.push({ legacy_url: url, legacy_attachment_id: id });
    }
  }
  console.log(`Candidate legacy URLs: ${candidates.length}`);

  if (!write) return { inserted: 0 };

  let inserted = 0;
  const BATCH = 500;
  for (let i = 0; i < candidates.length; i += BATCH) {
    const slice = candidates.slice(i, i + BATCH);
    const placeholders: string[] = [];
    const params: unknown[] = [];
    let p = 1;
    for (const c of slice) {
      placeholders.push(`($${p++},$${p++})`);
      params.push(c.legacy_url, c.legacy_attachment_id);
    }
    await client.query(
      `INSERT INTO legacy_import.stg_media_url_map (legacy_url, legacy_attachment_id)
         VALUES ${placeholders.join(',')}
         ON CONFLICT (legacy_url) DO NOTHING`,
      params,
    );
    inserted += slice.length;
  }

  // Reset failed rows whose .in URL is reachable again
  const { rows: failed } = await client.query<{ legacy_url: string }>(
    `SELECT legacy_url FROM legacy_import.stg_media_url_map WHERE download_status = 'failed'`,
  );
  let reset = 0;
  for (const row of failed) {
    try {
      const res = await fetch(row.legacy_url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        await client.query(
          `UPDATE legacy_import.stg_media_url_map
              SET download_status = 'pending', download_error = NULL
            WHERE legacy_url = $1`,
          [row.legacy_url],
        );
        reset++;
      }
    } catch {
      // keep failed
    }
  }
  console.log(`Reset failed→pending (reachable): ${reset}`);
  return { inserted };
}

async function processOne(client: Client, supabase: SupabaseClient, legacyUrl: string, attachmentId: number) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  let bytes: Buffer;
  try {
    const res = await fetch(legacyUrl, { signal: ac.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    bytes = Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }

  if (bytes.byteLength < 200) throw new Error(`too small (${bytes.byteLength}b)`);

  const sha = createHash('sha256').update(bytes).digest('hex');
  const dup = await client.query(
    `SELECT storage_bucket, storage_path, public_url, width, height, mime_type, bytes
       FROM legacy_import.stg_media_url_map
      WHERE sha256 = $1 AND download_status = 'ok' LIMIT 1`,
    [sha],
  );
  if (dup.rows.length > 0) {
    const d = dup.rows[0];
    await client.query(
      `UPDATE legacy_import.stg_media_url_map
          SET sha256=$2, storage_bucket=$3, storage_path=$4, public_url=$5,
              width=$6, height=$7, mime_type=$8, bytes=$9,
              download_status='ok', download_error=NULL, completed_at=NOW()
        WHERE legacy_url=$1`,
      [legacyUrl, sha, d.storage_bucket, d.storage_path, d.public_url, d.width, d.height, d.mime_type, d.bytes],
    );
    return 'duplicate' as const;
  }

  const img = sharp(bytes, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  const webp = await img.webp({ quality: 82 }).toBuffer();
  const finalMeta = await sharp(webp).metadata();
  const key = `legacy/${sha.slice(0, 2)}/${sha}.webp`;

  const { error: upErr } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(key, webp, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
  if (upErr) throw new Error(`upload: ${upErr.message}`);

  const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(key);
  await client.query(
    `UPDATE legacy_import.stg_media_url_map
        SET sha256=$2, storage_bucket=$3, storage_path=$4, public_url=$5,
            width=$6, height=$7, mime_type='image/webp', bytes=$8,
            download_status='ok', download_error=NULL, completed_at=NOW()
      WHERE legacy_url=$1`,
    [legacyUrl, sha, MEDIA_BUCKET, key, pub.publicUrl, finalMeta.width ?? meta.width ?? null, finalMeta.height ?? meta.height ?? null, webp.byteLength],
  );
  void attachmentId;
  return 'ok' as const;
}

async function downloadMedia(client: Client, write: boolean) {
  console.log('\n--- Phase 2: download pending/failed media ---\n');
  const supaUrl = process.env.LEGACY_IMPORT_SUPABASE_URL;
  const supaKey = process.env.LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !supaKey) throw new Error('Missing LEGACY_IMPORT_SUPABASE_URL or service role key.');

  const { rows: pending } = await client.query<{ legacy_url: string; legacy_attachment_id: number }>(
    `SELECT m.legacy_url, m.legacy_attachment_id
       FROM legacy_import.stg_media_url_map m
      WHERE m.download_status IN ('pending', 'failed')
        AND NOT EXISTS (
          SELECT 1 FROM legacy_import.stg_media_url_map ok
           WHERE ok.legacy_attachment_id = m.legacy_attachment_id
             AND ok.download_status = 'ok'
             AND ok.public_url IS NOT NULL
        )
        AND m.legacy_url LIKE 'https://www.purevedicgems.in/%'`,
  );
  console.log(`Rows to download: ${pending.length}`);
  if (pending.length === 0 || !write) return { ok: 0, failed: 0 };

  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
  const { data: bucket } = await supabase.storage.getBucket(MEDIA_BUCKET);
  if (!bucket) {
    const { error } = await supabase.storage.createBucket(MEDIA_BUCKET, { public: true });
    if (error) throw error;
  }

  let done = 0;
  let ok = 0;
  let failed = 0;
  const queue = [...pending];

  async function worker() {
    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) break;
      done++;
      try {
        await processOne(client, supabase, job.legacy_url, job.legacy_attachment_id);
        ok++;
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        await client.query(
          `UPDATE legacy_import.stg_media_url_map
              SET download_status='failed', download_error=$2
            WHERE legacy_url=$1`,
          [job.legacy_url, msg.slice(0, 500)],
        );
      }
      if (done % 10 === 0 || done === pending.length) {
        process.stdout.write(`\r  processed ${done}/${pending.length} ok=${ok} failed=${failed}   `);
      }
    }
  }

  await Promise.all(Array.from({ length: DOWNLOAD_CONCURRENCY }, () => worker()));
  console.log(`\nDownload complete. ok=${ok} failed=${failed}`);
  return { ok, failed };
}

async function loadMediaMaps(client: Client) {
  const byLegacyUrl = new Map<string, string>();
  const attachmentToUrl = new Map<number, string>();

  const r = await client.query(
    `SELECT legacy_url, public_url
       FROM legacy_import.stg_media_url_map
      WHERE download_status = 'ok' AND public_url IS NOT NULL`,
  );
  for (const row of r.rows) byLegacyUrl.set(row.legacy_url, row.public_url);

  const a = await client.query(
    `SELECT pm.post_id::bigint AS attachment_id, pm.meta_value AS path
       FROM legacy_import.stg_wp_postmeta pm
      WHERE pm.meta_key = '_wp_attached_file'`,
  );
  for (const row of a.rows) {
    const id = Number(row.attachment_id);
    if (attachmentToUrl.has(id)) continue;
    for (const base of LEGACY_BASES) {
      const url = byLegacyUrl.get(base + row.path);
      if (url) {
        attachmentToUrl.set(id, url);
        break;
      }
    }
  }
  return { byLegacyUrl, attachmentToUrl };
}

function buildImagesArray(
  galleryIds: number[],
  primaryId: number | null,
  attachmentToUrl: Map<number, string>,
) {
  const ordered: number[] = [];
  if (primaryId && !ordered.includes(primaryId)) ordered.push(primaryId);
  for (const id of galleryIds) if (!ordered.includes(id)) ordered.push(id);

  const images: string[] = [];
  for (const id of ordered) {
    const url = attachmentToUrl.get(id);
    if (url && !images.includes(url)) images.push(url);
  }
  const primaryUrl = primaryId ? attachmentToUrl.get(primaryId) : undefined;
  return { images, thumbnail_url: primaryUrl ?? images[0] ?? null };
}

async function rebuildProducts(client: Client, write: boolean) {
  console.log('\n--- Phase 3: rebuild product images ---\n');
  const media = await loadMediaMaps(client);

  const products = await client.query(`
    SELECT p.id, p.slug, p.legacy_woo_id, p.thumbnail_url, p.images,
           thumb.meta_value AS thumbnail_id,
           gallery.meta_value AS gallery_raw
      FROM products p
      LEFT JOIN legacy_import.stg_wp_postmeta thumb
        ON thumb.post_id = p.legacy_woo_id AND thumb.meta_key = '_thumbnail_id'
      LEFT JOIN legacy_import.stg_wp_postmeta gallery
        ON gallery.post_id = p.legacy_woo_id AND gallery.meta_key = '_product_image_gallery'
     WHERE p.legacy_woo_id IS NOT NULL AND p.is_active = true
     ORDER BY p.slug
  `);

  const changes: Array<{ id: string; slug: string; thumbnail_url: string | null; images: string[] }> = [];
  let missing = 0;

  for (const row of products.rows) {
    const primaryId = row.thumbnail_id ? Number(row.thumbnail_id) : null;
    const galleryIds = parseGalleryIds(row.gallery_raw);
    const built = buildImagesArray(galleryIds, Number.isFinite(primaryId) ? primaryId : null, media.attachmentToUrl);

    if (!built.thumbnail_url) missing++;

    const currentImages = Array.isArray(row.images) ? row.images as string[] : [];
    if (built.images.length === 0 && currentImages.length > 0) continue;

    const changed =
      row.thumbnail_url !== built.thumbnail_url ||
      JSON.stringify(currentImages) !== JSON.stringify(built.images);

    if (changed) {
      changes.push({ id: row.id, slug: row.slug, thumbnail_url: built.thumbnail_url, images: built.images });
    }
  }

  const stillMissing = products.rows.filter((row) => {
    const primaryId = row.thumbnail_id ? Number(row.thumbnail_id) : null;
    const galleryIds = parseGalleryIds(row.gallery_raw);
    const built = buildImagesArray(galleryIds, Number.isFinite(primaryId) ? primaryId : null, media.attachmentToUrl);
    const currentImages = Array.isArray(row.images) ? row.images : [];
    return !built.thumbnail_url && !currentImages.length;
  });

  console.log(`Products scanned: ${products.rowCount}`);
  console.log(`Would update: ${changes.length}`);
  console.log(`Still missing images after rebuild: ${stillMissing.length}`);

  if (stillMissing.length > 0) {
    for (const row of stillMissing.slice(0, 10)) {
      console.log(`  missing: ${row.slug} (woo:${row.legacy_woo_id})`);
    }
  }

  if (!write || changes.length === 0) return { updated: 0, missing: stillMissing.length };

  for (const change of changes) {
    await client.query(
      `UPDATE products
          SET thumbnail_url = $2,
              images = $3::jsonb,
              og_image = COALESCE($2, og_image),
              updated_at = NOW()
        WHERE id = $1`,
      [change.id, change.thumbnail_url, JSON.stringify(change.images)],
    );
  }
  return { updated: changes.length, missing: stillMissing.length };
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL_PRODUCTION || process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('Missing database URL.');
  const host = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod)' : ''}`);
  console.log(`Host: ${host}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await client.query('BEGIN');
    await syncMissingPostmeta(client, flags.write);
    await enumerateMedia(client, flags.write);
    if (!flags.skipDownload) await downloadMedia(client, flags.write);
    const result = flags.skipRebuild ? { updated: 0, missing: 0 } : await rebuildProducts(client, flags.write);

    if (flags.write) {
      await client.query('COMMIT');
      console.log(`\nCOMMITTED. Products updated: ${result.updated}`);
    } else {
      await client.query('ROLLBACK');
      console.log('\nDRY-RUN complete (rolled back). Pass --write --write-prod to apply.');
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exit(1);
});
