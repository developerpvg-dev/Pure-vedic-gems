/**
 * Sync rudraksha gem_categories.image_url from representative product thumbnails.
 *
 *   npx tsx scripts/legacy-import/13-fix-rudraksha-category-images.ts
 *   npx tsx scripts/legacy-import/13-fix-rudraksha-category-images.ts --write --write-prod
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { RUDRAKSHA_STOREFRONT_SLUGS } from '../../src/lib/constants/rudraksha-subcategories';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

function parseArgs(argv: string[]) {
  return { write: argv.includes('--write'), writeProd: argv.includes('--write-prod') };
}

function assertWriteAllowed(dbHost: string, write: boolean, writeProd: boolean) {
  const isProd = dbHost.includes('kjsyhuybvzzfpybtlvei');
  if (write && isProd && !writeProd) {
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod.`);
  }
}

async function main() {
  const { write, writeProd } = parseArgs(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL_PRODUCTION || process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL missing');

  const dbHost = new URL(dbUrl.replace(/^postgres:/, 'postgresql:')).hostname;
  assertWriteAllowed(dbHost, write, writeProd);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    if (!write) await client.query('BEGIN');

    const updates: Array<{ slug: string; imageUrl: string; name: string }> = [];

    for (const slug of RUDRAKSHA_STOREFRONT_SLUGS) {
      const product = await client.query(
        `SELECT thumbnail_url
         FROM products
         WHERE category = 'rudraksha' AND sub_category = $1 AND is_active = true
           AND thumbnail_url IS NOT NULL AND thumbnail_url <> ''
         ORDER BY created_at DESC
         LIMIT 1`,
        [slug],
      );
      const imageUrl = product.rows[0]?.thumbnail_url ? String(product.rows[0].thumbnail_url) : null;
      if (!imageUrl) {
        console.log(`SKIP ${slug}: no product thumbnail`);
        continue;
      }

      const existing = await client.query(
        `SELECT id, name, image_url FROM gem_categories WHERE type = 'rudraksha' AND slug = $1 LIMIT 1`,
        [slug],
      );
      if (!existing.rowCount) {
        console.log(`SKIP ${slug}: no gem_categories row`);
        continue;
      }

      const row = existing.rows[0];
      if (row.image_url === imageUrl) {
        console.log(`OK ${slug}: already set`);
        continue;
      }

      updates.push({ slug, imageUrl, name: String(row.name) });
      if (write) {
        await client.query(`UPDATE gem_categories SET image_url = $1 WHERE id = $2`, [imageUrl, row.id]);
      }
      console.log(`${write ? 'UPDATE' : 'WOULD UPDATE'} ${slug} <- ${imageUrl}`);
    }

    if (!write) {
      await client.query('ROLLBACK');
      console.log(`\nDRY-RUN complete (${updates.length} updates). Pass --write --write-prod to apply.`);
    } else {
      console.log(`\nApplied ${updates.length} category image updates.`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
