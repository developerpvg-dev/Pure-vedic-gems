/**
 * upratna/02-stage.ts
 *
 * Load scripts/legacy-import/_raw/upratna/*.jsonl into shared legacy_import
 * raw WordPress mirror tables. Re-runs upsert by natural keys.
 */

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { parseRunMode } from '../lib/supabase.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const rawDir = resolve(here, '..', '_raw', 'upratna');
const BATCH_SIZE = 500;

type TableSpec = {
  jsonl: string;
  table: string;
  columns: string[];
  conflictKey: string;
  map: (row: Record<string, unknown>) => unknown[];
};

const TABLES: TableSpec[] = [
  {
    jsonl: 'terms.jsonl',
    table: 'legacy_import.stg_wp_terms',
    columns: ['term_id', 'name', 'slug', 'term_group'],
    conflictKey: 'term_id',
    map: (row) => [row.term_id, row.name, row.slug, row.term_group],
  },
  {
    jsonl: 'term_taxonomy.jsonl',
    table: 'legacy_import.stg_wp_term_taxonomy',
    columns: ['term_taxonomy_id', 'term_id', 'taxonomy', 'description', 'parent', 'count'],
    conflictKey: 'term_taxonomy_id',
    map: (row) => [row.term_taxonomy_id, row.term_id, row.taxonomy, row.description, row.parent, row.count],
  },
  {
    jsonl: 'term_relationships.jsonl',
    table: 'legacy_import.stg_wp_term_relationships',
    columns: ['object_id', 'term_taxonomy_id', 'term_order'],
    conflictKey: 'object_id, term_taxonomy_id',
    map: (row) => [row.object_id, row.term_taxonomy_id, row.term_order],
  },
  {
    jsonl: 'posts.jsonl',
    table: 'legacy_import.stg_wp_posts',
    columns: ['id', 'post_author', 'post_date_gmt', 'post_modified_gmt', 'post_content', 'post_title', 'post_excerpt', 'post_status', 'post_name', 'post_parent', 'post_type', 'menu_order', 'raw'],
    conflictKey: 'id',
    map: (row) => [row.ID, row.post_author, nullIfEmpty(row.post_date_gmt), nullIfEmpty(row.post_modified_gmt), row.post_content, row.post_title, row.post_excerpt, row.post_status, row.post_name, row.post_parent, row.post_type, row.menu_order, JSON.stringify(row)],
  },
  {
    jsonl: 'attachments.jsonl',
    table: 'legacy_import.stg_wp_posts',
    columns: ['id', 'post_author', 'post_date_gmt', 'post_modified_gmt', 'post_content', 'post_title', 'post_excerpt', 'post_status', 'post_name', 'post_parent', 'post_type', 'menu_order', 'raw'],
    conflictKey: 'id',
    map: (row) => [row.ID, row.post_author, nullIfEmpty(row.post_date_gmt), nullIfEmpty(row.post_modified_gmt), row.post_content, row.post_title, row.post_excerpt, row.post_status, row.post_name, row.post_parent, row.post_type, row.menu_order, JSON.stringify(row)],
  },
  {
    jsonl: 'postmeta.jsonl',
    table: 'legacy_import.stg_wp_postmeta',
    columns: ['meta_id', 'post_id', 'meta_key', 'meta_value'],
    conflictKey: 'meta_id',
    map: (row) => [row.meta_id, row.post_id, row.meta_key, row.meta_value],
  },
  {
    jsonl: 'attachment_meta.jsonl',
    table: 'legacy_import.stg_wp_postmeta',
    columns: ['meta_id', 'post_id', 'meta_key', 'meta_value'],
    conflictKey: 'meta_id',
    map: (row) => [row.meta_id, row.post_id, row.meta_key, row.meta_value],
  },
];

function parseFlags(argv: string[]) {
  const writeProd = argv.includes('--write-prod');
  const { write } = parseRunMode(argv.filter((arg) => arg !== '--write-prod'));
  return { write, writeProd };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((host) => host.trim()).filter(Boolean);
  if (write && !writeProd && prodHosts.some((host) => normalised === host.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod only after dry-run review.`);
  }
  return dbHost;
}

function nullIfEmpty(value: unknown): unknown {
  if (value === '' || value === null || value === undefined) return null;
  if (typeof value === 'string' && value.startsWith('0000-00-00')) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return value + '+00';
  return value;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL in env.');

  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}`);
  console.log(`Host: ${dbHost}\n`);

  if (!flags.write) {
    for (const spec of TABLES) {
      const count = await countLines(resolve(rawDir, spec.jsonl));
      console.log(`  ${spec.jsonl.padEnd(28)} -> ${spec.table} (${count} rows would be upserted)`);
    }
    console.log('\nDry-run only. Pass --write to apply. Add --write-prod only after production review.');
    return;
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const spec of TABLES) await loadJsonl(client, spec);
    console.log('\nVerifying raw table counts...');
    for (const table of ['stg_wp_terms', 'stg_wp_term_taxonomy', 'stg_wp_term_relationships', 'stg_wp_posts', 'stg_wp_postmeta']) {
      const { rows } = await client.query(`SELECT COUNT(*)::int AS n FROM legacy_import.${table}`);
      console.log(`  legacy_import.${table.padEnd(28)}: ${rows[0].n}`);
    }
  } finally {
    await client.end();
  }
  console.log('\nStage complete.');
}

async function countLines(path: string): Promise<number> {
  const stream = createReadStream(path, { encoding: 'utf8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let count = 0;
  for await (const line of rl) if (line.trim().length > 0) count++;
  return count;
}

async function loadJsonl(client: Client, spec: TableSpec): Promise<void> {
  console.log(`Loading ${spec.jsonl} -> ${spec.table} ...`);
  const stream = createReadStream(resolve(rawDir, spec.jsonl), { encoding: 'utf8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let batch: unknown[][] = [];
  let total = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as Record<string, unknown>;
    batch.push(spec.map(row));
    if (batch.length >= BATCH_SIZE) {
      await flush(client, spec, batch);
      total += batch.length;
      process.stdout.write(`\r  ...${total} rows`);
      batch = [];
    }
  }
  if (batch.length) {
    await flush(client, spec, batch);
    total += batch.length;
  }
  process.stdout.write(`\r  ${total} rows loaded.\n`);
}

async function flush(client: Client, spec: TableSpec, batch: unknown[][]): Promise<void> {
  const placeholders: string[] = [];
  const params: unknown[] = [];
  let param = 1;
  for (const row of batch) {
    const rowPlaceholders: string[] = [];
    for (const value of row) {
      rowPlaceholders.push(`$${param++}`);
      params.push(value);
    }
    placeholders.push(`(${rowPlaceholders.join(',')})`);
  }
  const conflictColumns = spec.conflictKey.split(',').map((key) => key.trim());
  const updateCols = spec.columns
    .filter((column) => !conflictColumns.includes(column))
    .map((column) => `${column} = EXCLUDED.${column}`)
    .join(', ');
  const onConflict = updateCols
    ? `ON CONFLICT (${spec.conflictKey}) DO UPDATE SET ${updateCols}`
    : `ON CONFLICT (${spec.conflictKey}) DO NOTHING`;
  await client.query(
    `INSERT INTO ${spec.table} (${spec.columns.join(', ')}) VALUES ${placeholders.join(',')} ${onConflict}`,
    params,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
