/**
 * yagyas/seed-yagyas.ts
 *
 * Seeds the Vedic Yagyas catalogue (24 service products) into public.products
 * and registers a "yagyas" service category. Yagya card images are downloaded
 * from the legacy .com site, converted to WebP and uploaded to Supabase
 * Storage (the same images used on the old website cards).
 *
 * After seeding, every field (price, description, image, status) is editable
 * from the admin panel at /admin/yagyas.
 *
 * Idempotent: products are matched on slug. By default existing rows are left
 * untouched (admin edits are preserved); pass --reseed to overwrite seed fields.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/yagyas/seed-yagyas.ts                          (dry-run)
 *   npx tsx scripts/legacy-import/yagyas/seed-yagyas.ts --write --write-prod     (write to prod)
 *   npx tsx scripts/legacy-import/yagyas/seed-yagyas.ts --write --write-prod --reseed
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import pgTypes from 'pg';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { parseRunMode } from '../lib/supabase.js';
import { buildDescriptionHtml, buildBenefits, buildShortDesc, type YagyaSeedEntry } from './yagya-content.js';

pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const MEDIA_BUCKET = process.env.MEDIA_BUCKET ?? 'product-images';
const STORAGE_PREFIX = 'yagyas';
const CATEGORY_SLUG = 'yagyas';
const FETCH_TIMEOUT_MS = Number(process.env.LEGACY_IMPORT_FETCH_TIMEOUT_MS ?? '240000') || 240_000;
const FETCH_MAX_ATTEMPTS = 5;

type SeedFile = { source: string; scrapedAt: string; imageBase: string; yagyas: YagyaSeedEntry[] };

function parseFlags(argv: string[]) {
  const writeProd = argv.includes('--write-prod');
  const reseed = argv.includes('--reseed');
  const { write } = parseRunMode(argv.filter((a) => a !== '--write-prod' && a !== '--reseed'));
  return { write, writeProd, reseed };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  if (write && !writeProd && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod only after dry-run review.`);
  }
  return dbHost;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string): Promise<Buffer> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= FETCH_MAX_ATTEMPTS; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ac.signal, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      if (/HTTP 404|HTTP 410/.test(message)) throw err;
      if (attempt < FETCH_MAX_ATTEMPTS) await sleep(1000 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function imageStoragePath(imageFile: string): string {
  const base = imageFile.replace(/\.[a-z0-9]+$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${STORAGE_PREFIX}/${base}.webp`;
}

async function uploadImages(
  entries: YagyaSeedEntry[],
  imageBase: string,
  supaUrl: string,
  supaKey: string,
  write: boolean,
): Promise<Map<string, string>> {
  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
  const uniqueImages = [...new Set(entries.map((e) => e.image))];
  const urlByImage = new Map<string, string>();
  console.log(`Unique images: ${uniqueImages.length}`);

  for (const image of uniqueImages) {
    const storagePath = imageStoragePath(image);
    const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
    const publicUrl = pub.publicUrl;
    urlByImage.set(image, publicUrl);

    if (!write) {
      console.log(`  [dry-run] ${image} -> ${storagePath}`);
      continue;
    }

    const sourceUrl = imageBase.replace(/\/?$/, '/') + image;
    try {
      const buffer = await fetchWithRetry(sourceUrl);
      const webp = await sharp(buffer).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(storagePath, webp, { contentType: 'image/webp', upsert: true });
      if (error) throw error;
      console.log(`  uploaded ${image} (${(webp.length / 1024).toFixed(0)} KB) -> ${storagePath}`);
    } catch (err) {
      console.error(`  FAILED ${image}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return urlByImage;
}

async function upsertCategory(client: Client): Promise<string> {
  const res = await client.query<{ id: string }>(
    `INSERT INTO public.product_categories (slug, name, family, canonical_path, description, sort_order, is_active)
     VALUES ($1, $2, 'service', $3, $4, 100, TRUE)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, family = EXCLUDED.family, canonical_path = EXCLUDED.canonical_path, updated_at = NOW()
     RETURNING id`,
    [CATEGORY_SLUG, 'Vedic Yagyas', '/vedic-yagyas', 'Authentic Vedic Yagyas and Poojas performed by learned pandits on your behalf.'],
  );
  return res.rows[0].id;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  const supaUrl = process.env.LEGACY_IMPORT_SUPABASE_URL;
  const supaKey = process.env.LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');
  if (flags.write && (!supaUrl || !supaKey)) throw new Error('Missing LEGACY_IMPORT_SUPABASE_URL or LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY.');

  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  const seed = JSON.parse(readFileSync(resolve(here, 'yagyas-seed.json'), 'utf8')) as SeedFile;

  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}  reseed=${flags.reseed}`);
  console.log(`Host: ${dbHost}`);
  console.log(`Bucket: ${MEDIA_BUCKET}`);
  console.log(`Yagyas: ${seed.yagyas.length}\n`);

  const urlByImage = await uploadImages(seed.yagyas, seed.imageBase, supaUrl ?? '', supaKey ?? '', flags.write);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  let inserted = 0;
  let skipped = 0;
  try {
    await client.query('BEGIN');
    const categoryId = await upsertCategory(client);

    for (const [index, entry] of seed.yagyas.entries()) {
      const sku = `YGY-${String(index + 1).padStart(3, '0')}`;
      const imageUrl = urlByImage.get(entry.image) ?? null;
      const images = imageUrl ? [imageUrl] : [];
      const description = buildDescriptionHtml(entry);
      const benefits = buildBenefits(entry);
      const shortDesc = buildShortDesc(entry);
      const legacyData = { source: seed.source, legacy_slug: entry.legacySlug, legacy_buy_now: entry.buyNow, variant: entry.variant };

      const conflictClause = flags.reseed
        ? `ON CONFLICT (slug) DO UPDATE SET
             name = EXCLUDED.name, sku = EXCLUDED.sku, price = EXCLUDED.price,
             short_desc = EXCLUDED.short_desc, description = EXCLUDED.description,
             benefits = EXCLUDED.benefits, images = EXCLUDED.images, thumbnail_url = EXCLUDED.thumbnail_url,
             planet = EXCLUDED.planet, display_order = EXCLUDED.display_order, updated_at = NOW()
           RETURNING id, (xmax = 0) AS inserted`
        : `ON CONFLICT (slug) DO NOTHING RETURNING id, TRUE AS inserted`;

      const res = await client.query<{ id: string; inserted: boolean }>(
        `INSERT INTO public.products (
            sku, name, slug, category, sub_category, product_type,
            price, price_mode, currency, tax_status,
            planet, short_desc, description, benefits,
            images, thumbnail_url,
            in_stock, stock_quantity, stock_status, availability_status, sold_individually,
            service_duration, service_delivery_mode,
            is_active, featured, display_order,
            legacy_slug, legacy_data
         ) VALUES (
            $1, $2, $3, 'service', $4, 'service',
            $5, 'fixed', 'INR', 'taxable',
            $6, $7, $8, $9::jsonb,
            $10::jsonb, $11,
            TRUE, 999, 'in_stock', 'in_stock', FALSE,
            $12, $13,
            TRUE, FALSE, $14,
            $15, $16::jsonb
         )
         ${conflictClause}`,
        [
          sku,
          entry.name,
          entry.legacySlug,
          entry.planet,
          entry.price,
          entry.planet,
          shortDesc,
          description,
          JSON.stringify(benefits),
          JSON.stringify(images),
          images[0] ?? null,
          'Performed on an auspicious muhurat',
          'Performed by our pandits on your behalf (remote)',
          index,
          entry.legacySlug,
          JSON.stringify(legacyData),
        ],
      );

      let productId: string | null = res.rows[0]?.id ?? null;
      if (res.rows.length === 0) {
        skipped++;
        const existing = await client.query<{ id: string }>(`SELECT id FROM public.products WHERE slug = $1`, [entry.legacySlug]);
        productId = existing.rows[0]?.id ?? null;
      } else {
        inserted++;
      }

      if (productId) {
        await client.query(
          `INSERT INTO public.product_category_assignments (product_id, category_id, is_primary, sort_order, legacy_path)
           VALUES ($1, $2, TRUE, $3, $4)
           ON CONFLICT (product_id, category_id) DO UPDATE SET is_primary = TRUE, sort_order = EXCLUDED.sort_order`,
          [productId, categoryId, index, `/vedic-yagyas/${entry.legacySlug}`],
        );
      }
    }

    console.log(`\nInserted/updated: ${inserted}  Skipped (existing): ${skipped}`);
    if (flags.write) {
      await client.query('COMMIT');
      console.log('COMMITTED.');
    } else {
      await client.query('ROLLBACK');
      console.log('DRY-RUN: rolled back. Pass --write --write-prod to persist.');
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
