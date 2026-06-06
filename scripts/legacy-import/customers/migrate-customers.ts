/**
 * customers/migrate-customers.ts
 *
 * Migrate legacy WordPress/WooCommerce customers (wp_users + wp_usermeta) into
 * Supabase Auth + public.customer_profiles.
 *
 * Strategy (user-approved):
 *   - Create a Supabase Auth user per legacy customer with email_confirm=true
 *     and NO password. Customers set a password via "forgot password" on first
 *     login (forced password reset). No bulk emails are sent here.
 *   - Mirror name / phone / email into customer_profiles.
 *
 * Resumable + idempotent:
 *   - Existing auth.users emails are skipped for creation but still get a
 *     customer_profiles upsert.
 *   - Safe to re-run; only missing users are created.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/customers/migrate-customers.ts                       (dry-run)
 *   npx tsx scripts/legacy-import/customers/migrate-customers.ts --write --write-prod
 *   npx tsx scripts/legacy-import/customers/migrate-customers.ts --write --write-prod --limit 50
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import pgTypes from 'pg';
import { createClient } from '@supabase/supabase-js';
import { parseRunMode } from '../lib/supabase.js';
import { streamWpTable, type SqlValue } from '../lib/wp-sql.js';

pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const USERMETA_KEYS = new Set([
  'first_name',
  'last_name',
  'billing_first_name',
  'billing_last_name',
  'billing_phone',
  'billing_email',
]);

const CREATE_CONCURRENCY = Math.max(1, Math.min(8, Number(process.env.LEGACY_IMPORT_AUTH_CONCURRENCY ?? '4') || 4));

type LegacyUser = {
  id: number;
  email: string;
  login: string;
  displayName: string | null;
  registered: string | null;
  meta: Record<string, string>;
};

function parseFlags(argv: string[]) {
  const writeProd = argv.includes('--write-prod');
  const limitArg = argv.find((a) => a.startsWith('--limit'));
  const limit = limitArg ? Number(limitArg.split('=')[1] ?? argv[argv.indexOf(limitArg) + 1]) : null;
  const { write } = parseRunMode(argv.filter((a) => a !== '--write-prod' && a !== '--limit' && !a.startsWith('--limit=') && a !== String(limit)));
  return { write, writeProd, limit: Number.isFinite(limit) ? limit : null };
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

function fullName(u: LegacyUser): string | null {
  const first = u.meta.first_name || u.meta.billing_first_name || '';
  const last = u.meta.last_name || u.meta.billing_last_name || '';
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  if (u.displayName && u.displayName.trim()) return u.displayName.trim();
  return null;
}

function phone(u: LegacyUser): string | null {
  const p = (u.meta.billing_phone || '').trim();
  return p ? p.slice(0, 20) : null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  const dump = process.env.LEGACY_SQL_DUMP_PATH;
  const supaUrl = process.env.LEGACY_IMPORT_SUPABASE_URL;
  const supaKey = process.env.LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');
  if (!dump) throw new Error('Missing LEGACY_SQL_DUMP_PATH.');
  if (flags.write && (!supaUrl || !supaKey)) throw new Error('Missing LEGACY_IMPORT_SUPABASE_URL / SERVICE_ROLE_KEY.');

  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}  limit=${flags.limit ?? 'none'}`);
  console.log(`Host: ${dbHost}`);
  console.log(`Dump: ${dump}\n`);

  // Pass 1: collect users.
  const usersById = new Map<number, LegacyUser>();
  for await (const row of streamWpTable({ filePath: dump, tableName: 'wp_users' })) {
    const id = Number(row.ID);
    const email = (row.user_email ?? '').trim().toLowerCase();
    if (!id || !email || !isValidEmail(email)) continue;
    usersById.set(id, {
      id,
      email,
      login: row.user_login ?? '',
      displayName: row.display_name ?? null,
      registered: row.user_registered ?? null,
      meta: {},
    });
  }
  console.log(`Legacy users with valid email: ${usersById.size}`);

  // Pass 2: usermeta.
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'wp_usermeta',
    filter: (r: Record<string, SqlValue>) => usersById.has(Number(r.user_id)) && USERMETA_KEYS.has(String(r.meta_key)),
  })) {
    const u = usersById.get(Number(row.user_id));
    if (u && row.meta_key != null) u.meta[row.meta_key] = row.meta_value ?? '';
  }

  // Dedupe by email (keep lowest legacy id).
  const byEmail = new Map<string, LegacyUser>();
  for (const u of [...usersById.values()].sort((a, b) => a.id - b.id)) {
    if (!byEmail.has(u.email)) byEmail.set(u.email, u);
  }
  let candidates = [...byEmail.values()];
  if (flags.limit) candidates = candidates.slice(0, flags.limit);
  console.log(`Unique-email candidates: ${candidates.length}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Load existing auth users (email -> id) to make the run resumable.
  const existing = await client.query<{ id: string; email: string }>(`SELECT id, lower(email) AS email FROM auth.users WHERE email IS NOT NULL`);
  const authIdByEmail = new Map<string, string>();
  for (const r of existing.rows) authIdByEmail.set(r.email, r.id);
  console.log(`Existing auth users: ${authIdByEmail.size}`);

  if (!flags.write) {
    const toCreate = candidates.filter((u) => !authIdByEmail.has(u.email)).length;
    console.log(`\nDRY-RUN: would create ${toCreate} auth users and upsert ${candidates.length} customer_profiles.`);
    await client.end();
    return;
  }

  const admin = createClient(supaUrl!, supaKey!, { auth: { persistSession: false, autoRefreshToken: false } });

  let created = 0;
  let reused = 0;
  let failed = 0;
  let profiles = 0;

  // Create missing auth users with bounded concurrency.
  const toCreate = candidates.filter((u) => !authIdByEmail.has(u.email));
  console.log(`Creating ${toCreate.length} new auth users (concurrency ${CREATE_CONCURRENCY})...\n`);

  let cursor = 0;
  async function worker() {
    while (cursor < toCreate.length) {
      const u = toCreate[cursor++];
      let attempt = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        attempt++;
        const { data, error } = await admin.auth.admin.createUser({
          email: u.email,
          email_confirm: true,
          user_metadata: { full_name: fullName(u), legacy_woo_id: u.id, legacy_source: 'wp_users' },
        });
        if (!error && data.user) {
          authIdByEmail.set(u.email, data.user.id);
          created++;
          break;
        }
        const message = error?.message ?? 'unknown';
        // Already registered (race / prior partial run): fetch existing id.
        if (/already.*registered|already been registered|duplicate/i.test(message)) {
          const found = await client.query<{ id: string }>(`SELECT id FROM auth.users WHERE lower(email) = $1 LIMIT 1`, [u.email]);
          if (found.rows[0]) { authIdByEmail.set(u.email, found.rows[0].id); reused++; }
          else failed++;
          break;
        }
        if (/rate limit|429|too many/i.test(message) && attempt < 5) {
          await sleep(1000 * attempt);
          continue;
        }
        console.error(`  createUser failed for ${u.email}: ${message}`);
        failed++;
        break;
      }
      if ((created + reused + failed) % 250 === 0) {
        console.log(`  progress: created=${created} reused=${reused} failed=${failed}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CREATE_CONCURRENCY }, () => worker()));
  console.log(`\nAuth users: created=${created} reused=${reused} failed=${failed}`);

  // Upsert customer_profiles for everyone we have an auth id for.
  console.log('Upserting customer_profiles...');
  for (const u of candidates) {
    const authId = authIdByEmail.get(u.email);
    if (!authId) continue;
    await client.query(
      `INSERT INTO public.customer_profiles (id, full_name, phone, email, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET
         full_name = COALESCE(public.customer_profiles.full_name, EXCLUDED.full_name),
         phone = COALESCE(public.customer_profiles.phone, EXCLUDED.phone),
         email = COALESCE(public.customer_profiles.email, EXCLUDED.email),
         updated_at = NOW()`,
      [
        authId,
        fullName(u),
        phone(u),
        u.email,
        u.registered ? new Date(u.registered.replace(' ', 'T') + 'Z').toISOString() : new Date().toISOString(),
      ],
    );
    profiles++;
  }
  console.log(`customer_profiles upserted: ${profiles}`);

  await client.end();
  console.log('\nDONE.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
