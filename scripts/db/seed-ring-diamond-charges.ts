/**
 * Ensures ring designs with legacy diamond add-ons have diamond_charges + descriptions.
 * Skips rows that already have the expected diamond charge amount.
 *
 * Usage: npx tsx scripts/db/seed-ring-diamond-charges.ts
 *        npx tsx scripts/db/seed-ring-diamond-charges.ts --write
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

/** name → { diamond_charges, description } */
const RING_DIAMOND_DESIGNS: Record<
  string,
  { diamond_charges: Record<string, number>; description: string }
> = {
  'Design-14': {
    diamond_charges: { gold_18k: 17500 },
    description: '18K Gold: +17500 diamonds cost',
  },
  'Design-16': {
    diamond_charges: { gold_18k: 7500 },
    description: '18K Gold: +7500 diamonds cost',
  },
  'Design-17': {
    diamond_charges: { gold_18k: 7500 },
    description: '18K Gold: +7500 diamonds cost',
  },
  'Design-18': {
    diamond_charges: { gold_18k: 7500 },
    description: '18K Gold: +7500 diamonds cost',
  },
  'Design-20': {
    diamond_charges: { gold_18k: 20000 },
    description: '18K Gold: +20000 diamonds cost',
  },
  'Design-21': {
    diamond_charges: { gold_18k: 12500 },
    description: '18K Gold: +12500 diamonds cost',
  },
  'Design-23': {
    diamond_charges: { gold_18k: 5000 },
    description: '18K Gold: +5000 diamonds cost',
  },
  'Design-27': {
    diamond_charges: { gold_18k: 25000 },
    description: '18K Gold: +25000 diamonds cost',
  },
  'Design-28': {
    diamond_charges: { gold_18k: 35000 },
    description: '18K Gold: +35000 diamonds cost',
  },
  'Design-31': {
    diamond_charges: { gold_18k: 15000 },
    description: '18K Gold: +15000 diamonds cost',
  },
  'Design-32': {
    diamond_charges: { gold_18k: 7500 },
    description: '18K Gold: +7500 diamonds cost',
  },
  'Design-34': {
    diamond_charges: {},
    description:
      'Remark the price of the small stones to be used around the centre big depends on quality.',
  },
  'Design-36': {
    diamond_charges: { gold_22k: 100000 },
    description: '22K Gold: +1lakh Approx Extra Diamonds Cost',
  },
  'Design-47': {
    diamond_charges: { gold_18k: 25000 },
    description: '18K Gold: +25000 For Diamonds',
  },
  'Design-48': {
    diamond_charges: { gold_18k: 15000 },
    description: '18K Gold: +15000 Extra For Diamonds',
  },
  'Design-50': {
    diamond_charges: { gold_18k: 200000 },
    description: '18K Gold: +2Lakhs Extra For Diamonds',
  },
  'Design-51': {
    diamond_charges: { gold_18k: 25000 },
    description: '18K Gold: +25000 Extra For Diamonds',
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
    'supabase/migration_ring_diamond_charges_restore_2026.sql'
  );
  const sql = readFileSync(sqlPath, 'utf8');

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    const names = Object.keys(RING_DIAMOND_DESIGNS);
    const { rows } = await client.query<{
      name: string;
      diamond_charges: unknown;
      description: string | null;
    }>(
      `SELECT name, diamond_charges, description
       FROM jewelry_designs
       WHERE setting_type = 'ring' AND product_scope = 'gemstone' AND name = ANY($1::text[])
       ORDER BY sort_order`,
      [names]
    );

    const toUpdate: string[] = [];
    const skipped: string[] = [];
    const missing: string[] = names.filter((n) => !rows.some((r) => r.name === n));

    for (const row of rows) {
      const spec = RING_DIAMOND_DESIGNS[row.name];
      if (!spec) continue;
      const current = maxDiamondCharge(row.diamond_charges);
      const expected = expectedCharge(spec);
      const descOk =
        row.name === 'Design-34'
          ? (row.description ?? '').toLowerCase().includes('remark')
          : expected === 0 || current === expected;

      if (current === expected && descOk && (row.description || spec.description === '')) {
        skipped.push(row.name);
      } else {
        toUpdate.push(row.name);
      }
    }

    console.log('Ring diamond charges:', {
      found: rows.length,
      skipped,
      toUpdate,
      missing,
      write,
    });

    if (write && toUpdate.length > 0) {
      await client.query(sql);
      await client.query(
        `UPDATE jewelry_designs
         SET stone_addon_label = 'Diamond'
         WHERE setting_type = 'ring'
           AND product_scope = 'gemstone'
           AND name = ANY($1::text[])
           AND diamond_charges IS NOT NULL
           AND diamond_charges::text NOT IN ('{}', 'null')`,
        [toUpdate.filter((n) => n !== 'Design-34')]
      );
      await client.query(`NOTIFY pgrst, 'reload schema'`);
      console.log('Updated', toUpdate.length, 'design(s).');
    } else if (!write) {
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
