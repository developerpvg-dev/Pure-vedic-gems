/**
 * Migrate product images still hosted on purevedicgems.in → Supabase Storage.
 * CSP blocks .in hosts, so gap-fill products with those URLs show broken images.
 *
 *   npx tsx scripts/legacy-import/_fix-in-hosted-images.ts --prod
 *   npx tsx scripts/legacy-import/_fix-in-hosted-images.ts --write --write-prod
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
const FETCH_TIMEOUT_MS = 45_000;
const CONCURRENCY = 3;

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
    throw new Error(`Refusing to --write against production. Add --write-prod.`);
  }
  return dbHost;
}

function isInHosted(url: string | null | undefined): boolean {
  return Boolean(url && /purevedicgems\.in/i.test(url));
}

async function downloadWebp(url: string): Promise<{ webp: Buffer; sha: string; width: number | null; height: number | null }> {
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
  if (bytes.byteLength < 200) throw new Error(`too small (${bytes.byteLength}b)`);
  const sha = createHash('sha256').update(bytes).digest('hex');
  const img = sharp(bytes, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  const webp = await img.webp({ quality: 82 }).toBuffer();
  const finalMeta = await sharp(webp).metadata();
  return {
    webp,
    sha,
    width: finalMeta.width ?? meta.width ?? null,
    height: finalMeta.height ?? meta.height ?? null,
  };
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = flags.prod
    ? process.env.LEGACY_IMPORT_DATABASE_URL_PRODUCTION || process.env.DATABASE_URL
    : process.env.LEGACY_IMPORT_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('Missing database URL');
  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);

  const supaUrl = process.env.LEGACY_IMPORT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (flags.write && (!supaUrl || !supaKey)) throw new Error('Missing Supabase service role');

  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.prod ? ' (prod)' : ''}`);
  console.log(`Host: ${dbHost}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const { rows } = await client.query<{
    id: string;
    sku: string | null;
    name: string;
    thumbnail_url: string | null;
    images: unknown;
  }>(`
    SELECT id, sku, name, thumbnail_url, images
    FROM products
    WHERE is_active
      AND (
        thumbnail_url ILIKE '%purevedicgems.in%'
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(COALESCE(images, '[]'::jsonb)) u
          WHERE u ILIKE '%purevedicgems.in%'
        )
      )
    ORDER BY updated_at DESC NULLS LAST
  `);

  console.log(`Products with .in-hosted images: ${rows.length}`);

  const urls = new Set<string>();
  for (const r of rows) {
    if (isInHosted(r.thumbnail_url)) urls.add(r.thumbnail_url!);
    const imgs = Array.isArray(r.images) ? (r.images as string[]) : [];
    for (const u of imgs) if (isInHosted(u)) urls.add(u);
  }
  console.log(`Unique .in URLs: ${urls.size}`);
  if (!flags.write) {
    for (const u of [...urls].slice(0, 8)) console.log(`  ${u}`);
    if (urls.size > 8) console.log(`  … ${urls.size - 8} more`);
    await client.end();
    console.log('\nDRY-RUN. Re-run with --write --write-prod to upload + rewrite.');
    return;
  }

  const supabase = createClient(supaUrl!, supaKey!, { auth: { persistSession: false } });
  const { data: bucket } = await supabase.storage.getBucket(MEDIA_BUCKET);
  if (!bucket) {
    const { error } = await supabase.storage.createBucket(MEDIA_BUCKET, { public: true });
    if (error) throw error;
  }

  const urlMap = new Map<string, string>(); // legacy → supabase public
  const list = [...urls];
  let ok = 0;
  let failed = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < list.length) {
      const i = cursor++;
      const legacyUrl = list[i];
      try {
        const { webp, sha } = await downloadWebp(legacyUrl);
        const key = `legacy/${sha.slice(0, 2)}/${sha}.webp`;
        const { error: upErr } = await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(key, webp, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
        if (upErr) throw new Error(upErr.message);
        const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(key);
        urlMap.set(legacyUrl, pub.publicUrl);
        ok++;
      } catch (e) {
        failed++;
        console.error(`\n  FAIL ${legacyUrl.slice(0, 90)}: ${e instanceof Error ? e.message : e}`);
      }
      if ((ok + failed) % 10 === 0 || ok + failed === list.length) {
        process.stdout.write(`\r  uploaded ${ok + failed}/${list.length} ok=${ok} failed=${failed}   `);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log(`\nUpload done. ok=${ok} failed=${failed}`);

  let updated = 0;
  let skipped = 0;
  for (const r of rows) {
    const imgs = Array.isArray(r.images) ? (r.images as string[]) : [];
    const nextImages = imgs.map((u) => urlMap.get(u) ?? u).filter((u) => !isInHosted(u) || urlMap.has(u));
    // if mapped, prefer mapped; drop still-.in that failed
    const cleaned = nextImages.filter((u) => !isInHosted(u));
    let nextThumb = r.thumbnail_url;
    if (isInHosted(nextThumb)) {
      nextThumb = urlMap.get(nextThumb!) ?? cleaned[0] ?? null;
    }
    if (isInHosted(nextThumb)) {
      skipped++;
      continue;
    }
    const changed =
      nextThumb !== r.thumbnail_url ||
      JSON.stringify(cleaned) !== JSON.stringify(imgs.filter((u) => !isInHosted(u) || urlMap.has(u)));
    // always write if we have a supabase thumb now
    if (!nextThumb && cleaned.length === 0) {
      skipped++;
      continue;
    }
    await client.query(
      `UPDATE products
          SET thumbnail_url = $2,
              images = $3::jsonb,
              updated_at = NOW()
        WHERE id = $1`,
      [r.id, nextThumb ?? cleaned[0] ?? null, JSON.stringify(cleaned.length ? cleaned : nextThumb ? [nextThumb] : [])],
    );
    updated++;
    void changed;
  }

  console.log(`Products updated: ${updated}  skipped (no usable image): ${skipped}`);

  const left = await client.query(`
    SELECT count(*)::int AS n FROM products
    WHERE is_active AND (
      thumbnail_url ILIKE '%purevedicgems.in%'
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(COALESCE(images, '[]'::jsonb)) u
        WHERE u ILIKE '%purevedicgems.in%'
      )
    )
  `);
  console.log(`Still on .in: ${left.rows[0].n}`);
  await client.end();
  console.log('\nDONE.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
