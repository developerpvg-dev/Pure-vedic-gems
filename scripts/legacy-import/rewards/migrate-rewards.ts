/**
 * rewards/migrate-rewards.ts
 *
 * Migrate legacy SUMO Reward Points rows from wp_rsrecordpoints into the new
 * public.reward_point_transactions ledger.
 *
 * Strategy:
 *   - Link wp_rsrecordpoints.userid -> wp_users.user_email -> auth.users.id.
 *   - Preserve one idempotent ledger row per SUMO row using legacy_reward_id.
 *   - Store net points: earnedpoints - redeempoints. Positive and negative
 *     rows both use type='migration' so the historical source stays explicit.
 *   - Preserve legacy order/user/product/checkpoint details for audit.
 *
 * Usage:
 *   npm run legacy:rewards
 *   npm run legacy:rewards -- --write --write-prod
 *   npm run legacy:rewards -- --write --write-prod --limit 500
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import pgTypes from 'pg';
import { parseRunMode } from '../lib/supabase.js';
import { streamWpTable, type SqlValue } from '../lib/wp-sql.js';

pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

type LegacyReward = {
  id: number;
  userId: number;
  points: number;
  earnedPoints: number;
  redeemedPoints: number;
  earnedAmount: number;
  redeemedAmount: number;
  legacyOrderId: number | null;
  legacyProductId: number | null;
  legacyVariationId: number | null;
  refUserId: number | null;
  checkpoint: string | null;
  description: string | null;
  totalPoints: number | null;
  createdAt: string;
  expiresAt: string | null;
  raw: Record<string, SqlValue>;
};

function parseFlags(argv: string[]) {
  const writeProd = argv.includes('--write-prod');
  const limitArg = argv.find((arg) => arg.startsWith('--limit'));
  const limit = limitArg ? Number(limitArg.split('=')[1] ?? argv[argv.indexOf(limitArg) + 1]) : null;
  const filtered = argv.filter((arg) => arg !== '--write-prod' && arg !== '--limit' && !arg.startsWith('--limit=') && arg !== String(limit));
  const { write } = parseRunMode(filtered);
  return { write, writeProd, limit: Number.isFinite(limit) && Number(limit) > 0 ? Number(limit) : null };
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function num(value: SqlValue | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableInt(value: SqlValue | undefined): number | null {
  const parsed = Math.trunc(num(value));
  return parsed > 0 ? parsed : null;
}

function points(value: SqlValue | undefined): number {
  return Math.round(num(value));
}

function legacyDateToIso(value: SqlValue | undefined): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(`${value} UTC`);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function unixSecondsToIso(value: SqlValue | undefined): string | null {
  const parsed = Math.trunc(num(value));
  if (parsed <= 0) return null;
  const date = new Date(parsed * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseReward(row: Record<string, SqlValue>): LegacyReward | null {
  const id = Math.trunc(num(row.id));
  const userId = Math.trunc(num(row.userid));
  const earnedPoints = points(row.earnedpoints);
  const redeemedPoints = points(row.redeempoints);
  const netPoints = earnedPoints - redeemedPoints;
  if (!id || !userId || netPoints === 0) return null;

  const reason = (row.reasonindetail ?? '').trim();
  const checkpoint = (row.checkpoints ?? '').trim();
  return {
    id,
    userId,
    points: netPoints,
    earnedPoints,
    redeemedPoints,
    earnedAmount: num(row.earnedequauivalentamount),
    redeemedAmount: num(row.redeemequauivalentamount),
    legacyOrderId: nullableInt(row.orderid),
    legacyProductId: nullableInt(row.productid),
    legacyVariationId: nullableInt(row.variationid),
    refUserId: nullableInt(row.refuserid),
    checkpoint: checkpoint || null,
    description: reason || null,
    totalPoints: row.totalpoints == null ? null : num(row.totalpoints),
    createdAt: legacyDateToIso(row.earneddate),
    expiresAt: unixSecondsToIso(row.expirydate),
    raw: row,
  };
}

function defaultDescription(reward: LegacyReward) {
  if (reward.description) return reward.description;
  return reward.points > 0 ? 'Legacy reward points migrated' : 'Legacy redeemed points migrated';
}

async function loadOrderMap(client: Client) {
  const map = new Map<number, string>();
  try {
    const result = await client.query<{ id: string; legacy_woo_id: number }>(
      `SELECT id, legacy_woo_id FROM public.orders WHERE legacy_woo_id IS NOT NULL`,
    );
    for (const row of result.rows) map.set(Number(row.legacy_woo_id), row.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Order legacy map unavailable (${message}). Rewards will still preserve legacy_order_id.`);
  }
  return map;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  const dump = process.env.LEGACY_REWARDS_SQL_DUMP_PATH
    ?? process.env.LEGACY_SQL_DUMP_PATH
    ?? resolve(repoRoot, '..', 'pugemved_indb', 'pugemved_indb.sql');
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');

  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}  limit=${flags.limit ?? 'none'}`);
  console.log(`Host: ${dbHost}`);
  console.log(`Dump: ${dump}\n`);

  const emailByWpUserId = new Map<number, string>();
  for await (const row of streamWpTable({ filePath: dump, tableName: 'wp_users' })) {
    const id = Math.trunc(num(row.ID));
    const email = (row.user_email ?? '').trim().toLowerCase();
    if (id && email && isValidEmail(email)) emailByWpUserId.set(id, email);
  }
  console.log(`Legacy users with valid email: ${emailByWpUserId.size}`);

  const rewards: LegacyReward[] = [];
  for await (const row of streamWpTable({ filePath: dump, tableName: 'wp_rsrecordpoints' })) {
    const reward = parseReward(row);
    if (!reward) continue;
    rewards.push(reward);
    if (flags.limit && rewards.length >= flags.limit) break;
  }
  console.log(`Legacy reward ledger rows with non-zero net points: ${rewards.length}`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const authRes = await client.query<{ id: string; email: string }>(`SELECT id, lower(email) AS email FROM auth.users WHERE email IS NOT NULL`);
  const authIdByEmail = new Map<string, string>();
  for (const row of authRes.rows) authIdByEmail.set(row.email, row.id);
  console.log(`Auth users available for linking: ${authIdByEmail.size}`);

  const settingsRes = await client.query<{ point_value_inr: string | number }>(`SELECT point_value_inr FROM public.reward_settings WHERE id = 'default' LIMIT 1`).catch(() => ({ rows: [] as { point_value_inr: string | number }[] }));
  const pointValue = Number(settingsRes.rows[0]?.point_value_inr ?? 1) || 1;
  const orderIdByLegacy = await loadOrderMap(client);
  console.log(`Legacy orders available for linking: ${orderIdByLegacy.size}\n`);

  let matched = 0;
  let skippedNoEmail = 0;
  let skippedNoAuth = 0;
  let insertedOrUpdated = 0;
  let positive = 0;
  let negative = 0;
  let totalNetPoints = 0;

  try {
    await client.query('BEGIN');

    if (flags.write) {
      await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_transactions_legacy_reward ON public.reward_point_transactions(legacy_reward_id) WHERE legacy_reward_id IS NOT NULL`);
    }

    for (const reward of rewards) {
      const email = emailByWpUserId.get(reward.userId);
      if (!email) {
        skippedNoEmail++;
        continue;
      }
      const customerId = authIdByEmail.get(email);
      if (!customerId) {
        skippedNoAuth++;
        continue;
      }

      matched++;
      if (reward.points > 0) positive++; else negative++;
      totalNetPoints += reward.points;

      const equivalentAmount = reward.points > 0
        ? reward.earnedAmount || Math.abs(reward.points) * pointValue
        : reward.redeemedAmount || Math.abs(reward.points) * pointValue;
      const linkedOrderId = reward.legacyOrderId ? orderIdByLegacy.get(reward.legacyOrderId) ?? null : null;

      if (!flags.write) continue;

      await client.query(
        `INSERT INTO public.reward_point_transactions (
           customer_id, order_id, type, status, points, amount_inr, description,
           expires_at, legacy_reward_id, legacy_wp_user_id, legacy_order_id,
           checkpoint, metadata, created_at, updated_at
         ) VALUES ($1, $2, 'migration', 'confirmed', $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $12)
         ON CONFLICT (legacy_reward_id) WHERE legacy_reward_id IS NOT NULL DO UPDATE SET
           customer_id = EXCLUDED.customer_id,
           order_id = EXCLUDED.order_id,
           points = EXCLUDED.points,
           amount_inr = EXCLUDED.amount_inr,
           description = EXCLUDED.description,
           expires_at = EXCLUDED.expires_at,
           legacy_wp_user_id = EXCLUDED.legacy_wp_user_id,
           legacy_order_id = EXCLUDED.legacy_order_id,
           checkpoint = EXCLUDED.checkpoint,
           metadata = EXCLUDED.metadata,
           created_at = EXCLUDED.created_at,
           updated_at = NOW()`,
        [
          customerId,
          linkedOrderId,
          reward.points,
          Math.round(equivalentAmount * 100) / 100,
          defaultDescription(reward),
          reward.expiresAt,
          reward.id,
          reward.userId,
          reward.legacyOrderId,
          reward.checkpoint,
          JSON.stringify({
            legacy_source: 'wp_rsrecordpoints',
            legacy_email: email,
            earned_points: reward.earnedPoints,
            redeemed_points: reward.redeemedPoints,
            total_points_after_event: reward.totalPoints,
            legacy_product_id: reward.legacyProductId,
            legacy_variation_id: reward.legacyVariationId,
            legacy_ref_user_id: reward.refUserId,
            showmasterlog: reward.raw.showmasterlog,
            showuserlog: reward.raw.showuserlog,
            nominee_id: reward.raw.nomineeid,
            nominee_points: reward.raw.nomineepoints,
          }),
          reward.createdAt,
        ],
      );
      insertedOrUpdated++;
      if (insertedOrUpdated % 500 === 0) console.log(`  upserted ${insertedOrUpdated} reward rows...`);
    }

    if (flags.write) await client.query('COMMIT');
    else await client.query('ROLLBACK');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }

  console.log('Import summary:');
  console.log(`  linked rewards: ${matched}`);
  console.log(`  positive rows: ${positive}`);
  console.log(`  negative rows: ${negative}`);
  console.log(`  net points: ${totalNetPoints.toLocaleString('en-IN')}`);
  console.log(`  skipped missing wp email: ${skippedNoEmail}`);
  console.log(`  skipped missing auth user: ${skippedNoAuth}`);
  console.log(flags.write ? `  upserted: ${insertedOrUpdated}` : `  DRY-RUN: would upsert ${matched} rows`);
  console.log('\nDONE.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});