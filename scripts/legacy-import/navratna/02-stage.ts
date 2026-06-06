/**
 * navratna/02-stage.ts
 *
 * Load _raw/navratna/*.jsonl into the staging Supabase `legacy_import`
 * schema. Connects via the LEGACY_IMPORT_DATABASE_URL direct Postgres
 * connection (much faster than supabase-js for bulk inserts).
 *
 * Batched UPSERT keyed on each table's natural primary key. Re-running is a
 * no-op for unchanged rows.
 *
 * Production-host guard:
 *   - parseRunMode() requires explicit --write to mutate.
 *   - The DB host is checked against PROD_SUPABASE_HOSTS before any DDL.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/navratna/02-stage.ts --write
 *   npx tsx scripts/legacy-import/navratna/02-stage.ts --dry-run   (default)
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

const rawDir = resolve(here, '..', '_raw', 'navratna');
const BATCH_SIZE = 500;

interface TableSpec {
  jsonl: string;
  table: string;
  columns: string[];
  conflictKey: string;
  /** Map a JSONL row to the array of values matching `columns` order. */
  map: (row: Record<string, unknown>) => unknown[];
}

const TABLES: TableSpec[] = [
  {
    jsonl: 'terms.jsonl',
    table: 'legacy_import.stg_wp_terms',
    columns: ['term_id', 'name', 'slug', 'term_group'],
    conflictKey: 'term_id',
    map: (r) => [r.term_id, r.name, r.slug, r.term_group],
  },
  {
    jsonl: 'term_taxonomy.jsonl',
    table: 'legacy_import.stg_wp_term_taxonomy',
    columns: ['term_taxonomy_id', 'term_id', 'taxonomy', 'description', 'parent', 'count'],
    conflictKey: 'term_taxonomy_id',
    map: (r) => [r.term_taxonomy_id, r.term_id, r.taxonomy, r.description, r.parent, r.count],
  },
  {
    jsonl: 'term_relationships.jsonl',
    table: 'legacy_import.stg_wp_term_relationships',
    columns: ['object_id', 'term_taxonomy_id', 'term_order'],
    conflictKey: 'object_id, term_taxonomy_id',
    map: (r) => [r.object_id, r.term_taxonomy_id, r.term_order],
  },
  {
    jsonl: 'posts.jsonl',
    table: 'legacy_import.stg_wp_posts',
    columns: [
      'id', 'post_author', 'post_date_gmt', 'post_modified_gmt',
      'post_content', 'post_title', 'post_excerpt', 'post_status',
      'post_name', 'post_parent', 'post_type', 'menu_order', 'raw',
    ],
    conflictKey: 'id',
    map: (r) => [
      r.ID,
      r.post_author,
      nullIfEmpty(r.post_date_gmt),
      nullIfEmpty(r.post_modified_gmt),
      r.post_content,
      r.post_title,
      r.post_excerpt,
      r.post_status,
      r.post_name,
      r.post_parent,
      r.post_type,
      r.menu_order,
      JSON.stringify(r),
    ],
  },
  {
    jsonl: 'attachments.jsonl',
    table: 'legacy_import.stg_wp_posts',
    columns: [
      'id', 'post_author', 'post_date_gmt', 'post_modified_gmt',
      'post_content', 'post_title', 'post_excerpt', 'post_status',
      'post_name', 'post_parent', 'post_type', 'menu_order', 'raw',
    ],
    conflictKey: 'id',
    map: (r) => [
      r.ID,
      r.post_author,
      nullIfEmpty(r.post_date_gmt),
      nullIfEmpty(r.post_modified_gmt),
      r.post_content,
      r.post_title,
      r.post_excerpt,
      r.post_status,
      r.post_name,
      r.post_parent,
      r.post_type,
      r.menu_order,
      JSON.stringify(r),
    ],
  },
  {
    jsonl: 'postmeta.jsonl',
    table: 'legacy_import.stg_wp_postmeta',
    columns: ['meta_id', 'post_id', 'meta_key', 'meta_value'],
    conflictKey: 'meta_id',
    map: (r) => [r.meta_id, r.post_id, r.meta_key, r.meta_value],
  },
  {
    jsonl: 'attachment_meta.jsonl',
    table: 'legacy_import.stg_wp_postmeta',
    columns: ['meta_id', 'post_id', 'meta_key', 'meta_value'],
    conflictKey: 'meta_id',
    map: (r) => [r.meta_id, r.post_id, r.meta_key, r.meta_value],
  },
];

function nullIfEmpty(v: unknown): unknown {
  // WordPress writes '0000-00-00 00:00:00' for missing timestamps. Postgres
  // rejects that as TIMESTAMPTZ.
  if (v === '' || v === null || v === undefined) return null;
  if (typeof v === 'string' && v.startsWith('0000-00-00')) return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v)) {
    return v + '+00';
  }
  return v;
}

async function main() {
  const mode = parseRunMode(process.argv.slice(2));

  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL in env.');

  // Production-host guard. Strip the `db.` prefix because the API host listed
  // in PROD_SUPABASE_HOSTS does not carry it.
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '')
    .split(',').map((h) => h.trim()).filter(Boolean);
  if (mode.write && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error(
      `Refusing to --write against production host "${dbHost}". ` +
        'Point LEGACY_IMPORT_DATABASE_URL at staging.',
    );
  }

  console.log(`Mode: ${mode.write ? 'WRITE' : 'DRY-RUN'}`);
  console.log(`Host: ${dbHost}\n`);

  if (!mode.write) {
    // Dry-run: count rows in each JSONL.
    for (const spec of TABLES) {
      const n = await countLines(resolve(rawDir, spec.jsonl));
      console.log(`  ${spec.jsonl.padEnd(28)} -> ${spec.table}  (${n} rows would be upserted)`);
    }
    console.log('\nDry-run only. Pass --write to apply.');
    return;
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected.\n');

  try {
    for (const spec of TABLES) {
      await loadJsonl(client, spec);
    }

    console.log('\nVerifying counts...');
    for (const t of ['stg_wp_terms', 'stg_wp_term_taxonomy', 'stg_wp_term_relationships',
                     'stg_wp_posts', 'stg_wp_postmeta']) {
      const { rows } = await client.query(`SELECT COUNT(*)::int AS n FROM legacy_import.${t}`);
      console.log(`  legacy_import.${t.padEnd(28)}: ${rows[0].n}`);
    }
  } finally {
    await client.end();
  }

  console.log('\nStage complete.');
}

async function countLines(path: string): Promise<number> {
  const stream = createReadStream(path, { encoding: 'utf8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let n = 0;
  for await (const line of rl) {
    if (line.trim().length > 0) n++;
  }
  return n;
}

async function loadJsonl(client: Client, spec: TableSpec): Promise<void> {
  const path = resolve(rawDir, spec.jsonl);
  console.log(`Loading ${spec.jsonl} -> ${spec.table} ...`);
  const stream = createReadStream(path, { encoding: 'utf8' });
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
  const colsSql = spec.columns.join(', ');
  const rowsSql: string[] = [];
  const params: unknown[] = [];
  let p = 1;
  for (const row of batch) {
    const placeholders: string[] = [];
    for (const v of row) {
      placeholders.push(`$${p++}`);
      params.push(v);
    }
    rowsSql.push(`(${placeholders.join(',')})`);
  }
  const updateCols = spec.columns
    .filter((c) => !spec.conflictKey.split(',').map((s) => s.trim()).includes(c))
    .map((c) => `${c} = EXCLUDED.${c}`)
    .join(', ');
  const onConflict = updateCols
    ? `ON CONFLICT (${spec.conflictKey}) DO UPDATE SET ${updateCols}`
    : `ON CONFLICT (${spec.conflictKey}) DO NOTHING`;
  const sql = `INSERT INTO ${spec.table} (${colsSql}) VALUES ${rowsSql.join(',')} ${onConflict}`;
  await client.query(sql, params);
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
