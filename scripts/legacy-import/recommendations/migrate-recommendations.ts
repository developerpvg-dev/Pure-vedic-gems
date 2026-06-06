import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { streamWpTable } from '../lib/wp-sql.js';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

const DUMP = path.resolve('..', 'purevedi_comnewlive', 'purevedi_comnewlive.sql');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

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

function cleanText(value: unknown) {
  const text = String(value ?? '').trim();
  return text || null;
}

function cleanEmail(value: unknown) {
  const email = String(value ?? '').trim().toLowerCase();
  return EMAIL_RE.test(email) ? email : null;
}

function parseMonth(value: unknown) {
  const text = String(value ?? '').trim().toLowerCase();
  const numeric = Number(text);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) return numeric;
  return MONTHS[text] ?? null;
}

function buildBirthDate(dayValue: unknown, monthValue: unknown, yearValue: unknown) {
  const day = Number(dayValue);
  const month = parseMonth(monthValue);
  const year = Number(yearValue);
  if (!Number.isInteger(day) || !month || !Number.isInteger(year) || year < 1900 || year > 2100) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

function parseBirthTime(value: unknown) {
  const text = String(value ?? '').trim();
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

async function readRecommendations() {
  const rows = [];
  for await (const row of streamWpTable({ filePath: DUMP, tableName: 'recommendations' })) {
    const legacyId = Number(row.id);
    if (!Number.isFinite(legacyId)) continue;
    const birthDate = buildBirthDate(row.dob_day, row.dob_month, row.dob_year);
    const purpose = cleanText(row.requirements);
    rows.push({
      legacyId,
      name: cleanText(row.name),
      phone: cleanText(row.phone),
      email: cleanEmail(row.email),
      birthDate,
      birthTime: parseBirthTime(row.tob),
      purpose,
      recommendation: {
        legacy_source: 'recommendations',
        birth_date_available: Boolean(birthDate),
        purpose,
      },
      legacyData: row,
    });
  }
  return rows.sort((a, b) => a.legacyId - b.legacyId);
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');
  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}`);
  console.log(`Host: ${dbHost}`);
  console.log(`Dump: ${DUMP}\n`);

  const rows = await readRecommendations();
  const selected = flags.limit ? rows.slice(0, flags.limit) : rows;
  console.log(`Source recommendation requests: ${rows.length}`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  let upserted = 0;
  try {
    await client.query('BEGIN');
    for (const row of selected) {
      const result = await client.query(
        `INSERT INTO recommendation_requests (
          legacy_wp_id, name, email, phone, birth_date, birth_time, purpose, recommendation,
          source, status, legacy_data
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,'legacy_recommendations','new',$9::jsonb)
        ON CONFLICT (legacy_wp_id) WHERE legacy_wp_id IS NOT NULL DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          birth_date = EXCLUDED.birth_date,
          birth_time = EXCLUDED.birth_time,
          purpose = EXCLUDED.purpose,
          recommendation = EXCLUDED.recommendation,
          source = EXCLUDED.source,
          status = CASE
            WHEN recommendation_requests.status IN ('contacted','converted','closed') THEN recommendation_requests.status
            ELSE EXCLUDED.status
          END,
          legacy_data = recommendation_requests.legacy_data || EXCLUDED.legacy_data,
          updated_at = NOW()
        RETURNING id`,
        [
          row.legacyId,
          row.name,
          row.email,
          row.phone,
          row.birthDate,
          row.birthTime,
          row.purpose,
          JSON.stringify(row.recommendation),
          JSON.stringify(row.legacyData),
        ],
      );
      if (result.rows.length) upserted++;
    }
    console.log(`Upserted recommendation requests: ${upserted}`);
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
