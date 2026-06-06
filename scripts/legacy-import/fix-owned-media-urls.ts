/**
 * Replaces legacy WordPress upload URLs in product media fields with the owned
 * Supabase Storage public URLs already recorded in legacy_import.stg_media_url_map.
 *
 * Dry-run by default:
 *   npx tsx scripts/legacy-import/fix-owned-media-urls.ts
 * Apply after reviewing dry-run:
 *   npx tsx scripts/legacy-import/fix-owned-media-urls.ts --write --write-prod
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const LEGACY_UPLOAD_RE = /https?:\/\/(?:www\.)?purevedicgems\.(?:com|in)\/wp-content\/uploads\/[^\s"'<>)]+/gi;
const LEGACY_UPLOAD_PATTERN = 'https?://(www\\.)?purevedicgems\\.(com|in)/wp-content/uploads';

type ProductRow = {
  id: string;
  slug: string;
  thumbnail_url: string | null;
  og_image: string | null;
  images: unknown;
  clean_description: string | null;
};

function parseFlags(argv: string[]) {
  return {
    write: argv.includes('--write'),
    writeProd: argv.includes('--write-prod'),
  };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((host) => host.trim()).filter(Boolean);
  if (write && !writeProd && prodHosts.some((host) => normalised === host.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod after dry-run review.`);
  }
  return dbHost;
}

function legacyUrlVariants(value: string) {
  const variants = new Set<string>([value]);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return variants;
  }

  const path = `${parsed.pathname}${parsed.search}`;
  for (const protocol of ['https:', 'http:']) {
    for (const host of ['www.purevedicgems.com', 'purevedicgems.com', 'www.purevedicgems.in', 'purevedicgems.in']) {
      variants.add(`${protocol}//${host}${path}`);
    }
  }
  return variants;
}

async function loadMediaMap(client: Client) {
  const rows = await client.query<{ legacy_url: string; public_url: string }>(
    `SELECT legacy_url, public_url
       FROM legacy_import.stg_media_url_map
      WHERE download_status = 'ok'
        AND public_url IS NOT NULL`,
  );

  const media = new Map<string, string>();
  for (const row of rows.rows) {
    for (const variant of legacyUrlVariants(row.legacy_url)) media.set(variant, row.public_url);
  }
  return media;
}

async function auditPublicLegacyUrls(client: Client) {
  const columns = await client.query<{ table_name: string; column_name: string }>(
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND data_type IN ('text', 'character varying', 'json', 'jsonb')
      ORDER BY table_name, ordinal_position`,
  );

  const findings: Array<{ table: string; column: string; count: number }> = [];
  for (const column of columns.rows) {
    const tableSql = `public.${quoteIdent(column.table_name)}`;
    const columnSql = quoteIdent(column.column_name);
    const result = await client.query<{ count: string }>(
      `SELECT count(*)::int AS count FROM ${tableSql} WHERE ${columnSql}::text ~* $1`,
      [LEGACY_UPLOAD_PATTERN],
    );
    const count = Number(result.rows[0]?.count ?? 0);
    if (count > 0) findings.push({ table: column.table_name, column: column.column_name, count });
  }
  return findings;
}

function quoteIdent(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function rewriteText(value: string | null, media: Map<string, string>, unresolved: Set<string>) {
  if (!value) return value;
  return value.replace(LEGACY_UPLOAD_RE, (match) => {
    const replacement = media.get(match);
    if (!replacement) unresolved.add(match);
    return replacement ?? match;
  });
}

function rewriteImages(value: unknown, media: Map<string, string>, unresolved: Set<string>) {
  const images = Array.isArray(value) ? value : [];
  let changed = false;
  const next = images.map((item) => {
    if (typeof item !== 'string') return item;
    const replacement = rewriteText(item, media, unresolved);
    if (replacement !== item) changed = true;
    return replacement;
  });
  return { images: changed ? next : images, changed };
}

async function repairProducts(client: Client, media: Map<string, string>, write: boolean) {
  const rows = await client.query<ProductRow>(
    `SELECT id, slug, thumbnail_url, og_image, images, clean_description
       FROM products
      WHERE coalesce(thumbnail_url, '') ~* $1
         OR coalesce(og_image, '') ~* $1
         OR images::text ~* $1
         OR coalesce(clean_description, '') ~* $1
      ORDER BY slug`,
    [LEGACY_UPLOAD_PATTERN],
  );

  const unresolved = new Set<string>();
  const changes: Array<{ id: string; slug: string; thumbnail_url: string | null; og_image: string | null; images: unknown[]; clean_description: string | null }> = [];

  for (const row of rows.rows) {
    const nextThumbnail = rewriteText(row.thumbnail_url, media, unresolved);
    const nextOgImage = rewriteText(row.og_image, media, unresolved);
    const nextDescription = rewriteText(row.clean_description, media, unresolved);
    const nextImages = rewriteImages(row.images, media, unresolved);

    if (nextThumbnail !== row.thumbnail_url || nextOgImage !== row.og_image || nextDescription !== row.clean_description || nextImages.changed) {
      changes.push({
        id: row.id,
        slug: row.slug,
        thumbnail_url: nextThumbnail,
        og_image: nextOgImage,
        images: nextImages.images,
        clean_description: nextDescription,
      });
    }
  }

  console.log(`Products containing legacy upload URLs: ${rows.rowCount}`);
  console.log(`Products with mapped replacements: ${changes.length}`);
  if (unresolved.size > 0) {
    console.log(`Unresolved legacy URLs: ${unresolved.size}`);
    for (const url of [...unresolved].slice(0, 20)) console.log(`  - ${url}`);
  }

  if (!write || changes.length === 0) return { changed: changes.length, unresolved: unresolved.size };
  if (unresolved.size > 0) {
    throw new Error('Refusing to write while unresolved legacy upload URLs remain. Add the missing media to storage first.');
  }

  for (const change of changes) {
    await client.query(
      `UPDATE products
          SET thumbnail_url = $2,
              images = $3::jsonb,
              clean_description = $4,
              og_image = $5,
              updated_at = NOW()
        WHERE id = $1`,
      [change.id, change.thumbnail_url, JSON.stringify(change.images), change.clean_description, change.og_image],
    );
  }

  return { changed: changes.length, unresolved: unresolved.size };
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL_PRODUCTION || process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL_PRODUCTION or LEGACY_IMPORT_DATABASE_URL.');
  const host = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}`);
  console.log(`Host: ${host}`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const media = await loadMediaMap(client);
    console.log(`Owned media mappings loaded: ${media.size}`);

    const findings = await auditPublicLegacyUrls(client);
    console.log('\nLegacy upload URL audit:');
    if (findings.length === 0) console.log('  none');
    else for (const finding of findings) console.log(`  ${finding.table}.${finding.column}: ${finding.count}`);

    await client.query('BEGIN');
    const result = await repairProducts(client, media, flags.write);
    if (flags.write) {
      await client.query('COMMIT');
      console.log(`\nCOMMITTED product repairs: ${result.changed}`);
    } else {
      await client.query('ROLLBACK');
      console.log(`\nDRY-RUN only. Product repairs available: ${result.changed}`);
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});