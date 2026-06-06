import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { streamWpTable } from '../lib/wp-sql.js';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

const DUMP = path.resolve('..', 'purevedi_comnewlive', 'purevedi_comnewlive.sql');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseFlags(argv: string[]) {
  const write = argv.includes('--write');
  const writeProd = argv.includes('--write-prod');
  const limitArg = argv.find((arg) => arg.startsWith('--limit'));
  const limit = limitArg ? Number(limitArg.split('=')[1] ?? argv[argv.indexOf(limitArg) + 1]) : null;
  return { write, writeProd, limit: Number.isFinite(limit) ? limit : null };
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

function cleanName(value: unknown) {
  const text = String(value ?? '').trim();
  return !text || text.toUpperCase() === 'NA' ? null : text;
}

function mapStatus(value: unknown) {
  const status = String(value ?? '').trim().toUpperCase();
  if (['UNS', 'UNSUB', 'UNSUBSCRIBED'].includes(status)) return 'unsubscribed';
  if (['PEN', 'PENDING'].includes(status)) return 'pending';
  return 'subscribed';
}

function parseDate(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text || text === '0000-00-00') return null;
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function readSubscribers() {
  const subscribers = [];
  for await (const row of streamWpTable({ filePath: DUMP, tableName: 'pvg_eemail_newsletter_sub' })) {
    const email = String(row.eemail_email_sub ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) continue;
    subscribers.push({
      legacyId: Number(row.eemail_id_sub),
      email,
      name: cleanName(row.eemail_name_sub),
      status: mapStatus(row.eemail_status_sub),
      subscribedAt: parseDate(row.eemail_date_sub),
      legacyData: row,
    });
  }
  return subscribers.sort((a, b) => a.legacyId - b.legacyId);
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');
  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}`);
  console.log(`Host: ${dbHost}`);
  console.log(`Dump: ${DUMP}\n`);

  const rows = await readSubscribers();
  const selected = flags.limit ? rows.slice(0, flags.limit) : rows;
  console.log(`Source newsletter subscribers: ${rows.length}`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  let upserted = 0;
  try {
    await client.query('BEGIN');
    for (const row of selected) {
      const result = await client.query(
        `INSERT INTO newsletter_subscribers (
          email, name, status, source, consent_source, consent_text, subscribed_at,
          legacy_wp_id, legacy_data
        ) VALUES ($1,$2,$3,'legacy_newsletter','legacy_wordpress_newsletter','Imported from legacy WordPress newsletter subscriber table.',$4,$5,$6::jsonb)
        ON CONFLICT (email) DO UPDATE SET
          name = COALESCE(EXCLUDED.name, newsletter_subscribers.name),
          status = CASE
            WHEN newsletter_subscribers.status = 'subscribed' AND EXCLUDED.status = 'pending' THEN newsletter_subscribers.status
            ELSE EXCLUDED.status
          END,
          source = EXCLUDED.source,
          consent_source = EXCLUDED.consent_source,
          consent_text = EXCLUDED.consent_text,
          subscribed_at = COALESCE(newsletter_subscribers.subscribed_at, EXCLUDED.subscribed_at),
          legacy_wp_id = EXCLUDED.legacy_wp_id,
          legacy_data = newsletter_subscribers.legacy_data || EXCLUDED.legacy_data,
          updated_at = NOW()
        RETURNING id`,
        [row.email, row.name, row.status, row.subscribedAt, row.legacyId, JSON.stringify(row.legacyData)],
      );
      if (result.rows.length) upserted++;
    }
    console.log(`Upserted newsletter subscribers: ${upserted}`);
    if (flags.write) {
      await client.query('COMMIT');
      console.log('COMMITTED.');
    } else {
      await client.query('ROLLBACK');
      console.log('DRY-RUN: rolled back. Pass --write --write-prod to persist.');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
