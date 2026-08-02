/**
 * Remove remaining WP upload URL dependencies from live products.
 * - og_image → copy supabase thumbnail when possible
 * - download any unresolved wp-content URLs found in product text/media fields
 * - rewrite fields to Supabase public URLs
 *
 *   npx tsx scripts/legacy-import/_scrub-wp-media-deps.ts --prod
 *   npx tsx scripts/legacy-import/_scrub-wp-media-deps.ts --write --write-prod
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
loadEnv({ path: resolve(repoRoot, '.env.local'), override: true });

const MEDIA_BUCKET = process.env.MEDIA_BUCKET ?? 'product-images';
const WP_URL_RE = /https?:\/\/(?:www\.)?purevedicgems\.(?:com|in)\/wp-content\/uploads\/[^\s"'<>)\\]]+/gi;
const WP_PATTERN = 'https?://(www\\.)?purevedicgems\\.(com|in)/wp-content/uploads';
const FETCH_TIMEOUT_MS = 45_000;

function isWpUpload(url: string) {
  return /purevedicgems\.(com|in)\/wp-content\/uploads/i.test(url);
}

function parseFlags(argv: string[]) {
  return {
    write: argv.includes('--write'),
    writeProd: argv.includes('--write-prod'),
    prod: argv.includes('--prod') || argv.includes('--write-prod'),
  };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  if (write && !writeProd && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error('Refusing to --write against production. Add --write-prod.');
  }
  return dbHost;
}

function variants(url: string) {
  const out = new Set<string>([url]);
  try {
    const u = new URL(url);
    const path = `${u.pathname}${u.search}`;
    for (const protocol of ['https:', 'http:']) {
      for (const host of [
        'www.purevedicgems.com',
        'purevedicgems.com',
        'www.purevedicgems.in',
        'purevedicgems.in',
      ]) {
        out.add(`${protocol}//${host}${path}`);
      }
    }
  } catch {
    /* */
  }
  return out;
}

function collectUrls(...values: Array<string | null | undefined>) {
  const found = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    for (const m of value.matchAll(WP_URL_RE)) found.add(m[0]);
  }
  return found;
}

async function ingest(
  supabase: ReturnType<typeof createClient>,
  url: string,
): Promise<string> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  let bytes: Buffer;
  try {
    const res = await fetch(url, { signal: ac.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    bytes = Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
  if (bytes.byteLength < 200) throw new Error(`too small ${bytes.byteLength}`);
  const sha = createHash('sha256').update(bytes).digest('hex');
  const webp = await sharp(bytes, { failOn: 'none' }).rotate().webp({ quality: 82 }).toBuffer();
  const key = `legacy/${sha.slice(0, 2)}/${sha}.webp`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(key, webp, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
  if (error) throw new Error(error.message);
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(key).data.publicUrl;
}

function rewrite(value: string | null, map: Map<string, string>): string | null {
  if (!value) return value;
  return value.replace(WP_URL_RE, (match) => map.get(match) ?? match);
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = flags.prod
    ? process.env.LEGACY_IMPORT_DATABASE_URL_PRODUCTION || process.env.DATABASE_URL
    : process.env.LEGACY_IMPORT_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('Missing database URL');
  const host = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.prod ? ' (prod)' : ''}`);
  console.log(`Host: ${host}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Load existing media map
  const map = new Map<string, string>();
  try {
    const { rows } = await client.query<{ legacy_url: string; public_url: string }>(
      `SELECT legacy_url, public_url FROM legacy_import.stg_media_url_map
       WHERE download_status='ok' AND public_url IS NOT NULL`,
    );
    for (const row of rows) {
      for (const v of variants(row.legacy_url)) map.set(v, row.public_url);
      map.set(row.legacy_url, row.public_url);
    }
    console.log(`Existing media map entries: ${rows.length} (${map.size} variants)`);
  } catch (e) {
    console.log('No stg_media_url_map (ok):', e instanceof Error ? e.message : e);
  }

  const { rows } = await client.query<{
    id: string;
    sku: string | null;
    thumbnail_url: string | null;
    og_image: string | null;
    images: unknown;
    video_url: string | null;
    short_desc: string | null;
    description: string | null;
    clean_description: string | null;
    legacy_html_description: string | null;
  }>(`
    SELECT id, sku, thumbnail_url, og_image, images, video_url,
           short_desc, description, clean_description, legacy_html_description
    FROM products
    WHERE coalesce(thumbnail_url,'') ~* $1
       OR coalesce(og_image,'') ~* $1
       OR images::text ~* $1
       OR coalesce(video_url,'') ~* $1
       OR coalesce(short_desc,'') ~* $1
       OR coalesce(description,'') ~* $1
       OR coalesce(clean_description,'') ~* $1
       OR coalesce(legacy_html_description,'') ~* $1
  `, [WP_PATTERN]);

  console.log(`Products with WP upload refs: ${rows.length}`);

  const needed = new Set<string>();
  for (const r of rows) {
    const imgs = Array.isArray(r.images) ? (r.images as string[]).join('\n') : '';
    for (const u of collectUrls(
      r.thumbnail_url,
      r.og_image,
      r.video_url,
      r.short_desc,
      r.description,
      r.clean_description,
      r.legacy_html_description,
      imgs,
    )) {
      if (!map.has(u)) needed.add(u);
    }
  }
  console.log(`WP URLs needing ingest: ${needed.size}`);

  if (!flags.write) {
    for (const u of [...needed].slice(0, 12)) console.log(' ', u);
    if (needed.size > 12) console.log(`  … ${needed.size - 12} more`);
    await client.end();
    console.log('\nDRY-RUN complete.');
    return;
  }

  const supabase = createClient(
    process.env.LEGACY_IMPORT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  let ok = 0;
  let failed = 0;
  for (const url of needed) {
    try {
      // Prefer .in then .com variants
      let publicUrl: string | null = null;
      for (const candidate of variants(url)) {
        try {
          publicUrl = await ingest(supabase, candidate);
          break;
        } catch {
          /* try next */
        }
      }
      if (!publicUrl) throw new Error('all variants failed');
      for (const v of variants(url)) map.set(v, publicUrl);
      map.set(url, publicUrl);
      // best-effort record in stg map
      try {
        await client.query(
          `INSERT INTO legacy_import.stg_media_url_map (legacy_url, public_url, download_status, completed_at)
           VALUES ($1, $2, 'ok', NOW())
           ON CONFLICT (legacy_url) DO UPDATE SET
             public_url = EXCLUDED.public_url,
             download_status = 'ok',
             completed_at = NOW()`,
          [url, publicUrl],
        );
      } catch {
        /* optional */
      }
      ok++;
      if (ok % 20 === 0) console.log(`  ingested ${ok}/${needed.size}`);
    } catch (e) {
      failed++;
      console.error(`  FAIL ${url.slice(0, 100)}: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`Ingest done ok=${ok} failed=${failed}`);

  let updated = 0;
  let leftover = 0;
  for (const r of rows) {
    const imgs = Array.isArray(r.images) ? (r.images as string[]) : [];
    const nextImages = imgs.map((u) => map.get(u) ?? u);
    let nextThumb = rewrite(r.thumbnail_url, map);
    let nextOg = rewrite(r.og_image, map);
    // If og still WP but thumb is owned, use thumb
    if (nextOg && isWpUpload(nextOg) && nextThumb && !isWpUpload(nextThumb)) {
      nextOg = nextThumb;
    }
    if ((!nextOg || isWpUpload(nextOg)) && nextThumb && !isWpUpload(nextThumb)) {
      nextOg = nextThumb;
    }
    const nextVideo = rewrite(r.video_url, map);
    const nextShort = rewrite(r.short_desc, map);
    const nextDesc = rewrite(r.description, map);
    const nextClean = rewrite(r.clean_description, map);
    const nextLegacyHtml = rewrite(r.legacy_html_description, map);

    const blob = [
      nextThumb,
      nextOg,
      nextVideo,
      nextShort,
      nextDesc,
      nextClean,
      nextLegacyHtml,
      ...nextImages,
    ]
      .filter(Boolean)
      .join('\n');
    if (blob.match(WP_URL_RE)) leftover++;

    await client.query(
      `UPDATE products SET
         thumbnail_url = $2,
         og_image = $3,
         images = $4::jsonb,
         video_url = $5,
         short_desc = $6,
         description = $7,
         clean_description = $8,
         legacy_html_description = $9,
         updated_at = NOW()
       WHERE id = $1`,
      [
        r.id,
        nextThumb,
        nextOg,
        JSON.stringify(nextImages),
        nextVideo,
        nextShort,
        nextDesc,
        nextClean,
        nextLegacyHtml,
      ],
    );
    updated++;
  }

  // orders.items image_url
  const orders = await client.query<{ id: string; items: unknown }>(
    `SELECT id, items FROM orders WHERE items::text ~* $1`,
    [WP_PATTERN],
  );
  let ordersFixed = 0;
  for (const o of orders.rows) {
    const items = Array.isArray(o.items) ? (o.items as Array<Record<string, unknown>>) : [];
    let changed = false;
    const next = items.map((item) => {
      if (typeof item.image_url !== 'string' || !isWpUpload(item.image_url)) return item;
      const mapped = map.get(item.image_url) ?? rewrite(item.image_url, map);
      changed = true;
      // Drop unresolved WP hosts — CSP blocks them and the old site is going away
      return {
        ...item,
        image_url: mapped && !isWpUpload(mapped) ? mapped : null,
      };
    });
    if (changed) {
      await client.query(`UPDATE orders SET items = $2::jsonb, updated_at = NOW() WHERE id = $1`, [
        o.id,
        JSON.stringify(next),
      ]);
      ordersFixed++;
    }
  }

  const left = await client.query(
    `SELECT count(*)::int n FROM products WHERE
       coalesce(thumbnail_url,'') ~* $1 OR coalesce(og_image,'') ~* $1
       OR images::text ~* $1 OR coalesce(video_url,'') ~* $1
       OR coalesce(short_desc,'') ~* $1 OR coalesce(description,'') ~* $1
       OR coalesce(clean_description,'') ~* $1 OR coalesce(legacy_html_description,'') ~* $1`,
    [WP_PATTERN],
  );

  console.log(`\nProducts updated: ${updated}`);
  console.log(`Products still containing WP urls after rewrite: ${left.rows[0].n} (unmapped leftovers during pass: ${leftover})`);
  console.log(`Orders items fixed: ${ordersFixed}`);
  await client.end();
  console.log('\nDONE.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
