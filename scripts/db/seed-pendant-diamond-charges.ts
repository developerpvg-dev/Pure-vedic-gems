/**
 * Ensures gemstone pendant designs with legacy diamond add-ons have diamond_charges.
 * Skips rows that already have the expected diamond charge amount.
 *
 * Usage: npx tsx scripts/db/seed-pendant-diamond-charges.ts
 *        npx tsx scripts/db/seed-pendant-diamond-charges.ts --write
 */
import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const write = process.argv.includes('--write');

const PENDANT_DIAMOND_DESIGNS: Record<
  string,
  { diamond_charges: Record<string, number>; description: string }
> = {
  'Design-6': {
    diamond_charges: { gold_18k: 2000 },
    description: '18K Gold: +2000 Diamonds Cost',
  },
  'Design-7': {
    diamond_charges: { gold_18k: 3000 },
    description: '18K Gold: +3000 Diamonds Cost',
  },
  'Design-16': {
    diamond_charges: { gold_18k: 20000 },
    description: '18K Gold: +20000 Diamonds Cost',
  },
  'Design-18': {
    diamond_charges: { gold_18k: 8000 },
    description: '18K Gold: +8000 Diamonds Cost',
  },
  'Design-20': {
    diamond_charges: { gold_18k: 6000 },
    description: '18K Gold: +6000 Diamonds Cost',
  },
  'Design-22': {
    diamond_charges: { gold_18k: 8000 },
    description: '18K Gold: +8000 Diamonds Cost',
  },
  'Design-23': {
    diamond_charges: { gold_18k: 30000 },
    description: '18K Gold: +30000 Diamonds Cost',
  },
  'Design-25': {
    diamond_charges: { gold_18k: 15000 },
    description: '18K Gold: +15000 Diamonds Cost',
  },
  'Design-26': {
    diamond_charges: { gold_18k: 10000 },
    description: '18K Gold: +10000 Diamonds Cost',
  },
  'Design-27': {
    diamond_charges: { gold_18k: 15000 },
    description: '18K Gold: +15000 Diamonds Cost',
  },
  'Design-29': {
    diamond_charges: { gold_18k: 5000 },
    description: '18K Gold: +5000 Diamonds Cost',
  },
};

function maxDiamondCharge(raw: unknown): number {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 0;
  const values = Object.values(raw as Record<string, unknown>).filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v)
  );
  return values.length > 0 ? Math.max(...values) : 0;
}

function expectedCharge(spec: { diamond_charges: Record<string, number> }): number {
  const values = Object.values(spec.diamond_charges);
  return values.length > 0 ? Math.max(...values) : 0;
}

async function main() {
  const sqlPath = path.resolve(
    process.cwd(),
    'supabase/migration_pendant_diamond_charges_restore_2026.sql'
  );
  const sql = readFileSync(sqlPath, 'utf8');

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    const names = Object.keys(PENDANT_DIAMOND_DESIGNS);
    const { rows } = await client.query<{
      name: string;
      diamond_charges: unknown;
      description: string | null;
    }>(
      `SELECT name, diamond_charges, description
       FROM jewelry_designs
       WHERE setting_type = 'pendant' AND product_scope = 'gemstone' AND name = ANY($1::text[])
       ORDER BY sort_order`,
      [names]
    );

    const toUpdate: string[] = [];
    const skipped: string[] = [];
    const missing: string[] = names.filter((n) => !rows.some((r) => r.name === n));

    for (const row of rows) {
      const spec = PENDANT_DIAMOND_DESIGNS[row.name];
      if (!spec) continue;
      const current = maxDiamondCharge(row.diamond_charges);
      const expected = expectedCharge(spec);
      if (current === expected) {
        skipped.push(row.name);
      } else {
        toUpdate.push(row.name);
      }
    }

    console.log('Pendant diamond charges:', {
      found: rows.length,
      skipped,
      toUpdate,
      missing,
      write,
    });

    if (write && toUpdate.length > 0) {
      await client.query(sql);
      await client.query(`NOTIFY pgrst, 'reload schema'`);
      console.log('Updated', toUpdate.length, 'design(s).');
    } else if (!write && toUpdate.length > 0) {
      console.log('Dry run. Re-run with --write to apply.');
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
