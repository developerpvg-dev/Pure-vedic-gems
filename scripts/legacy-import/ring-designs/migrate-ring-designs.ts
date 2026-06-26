import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  buildDesignRecords,
  extractDesignImages,
  generateSqlSeed,
  parseRingDesignsFromFile,
} from './parse-ring-designs';
import { upsertJewelryDesignRecords } from '../jewelry-designs/upsert-records';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

function parseFlags(argv: string[]) {
  return {
    write: argv.includes('--write'),
    writeProd: argv.includes('--write-prod'),
  };
}

function assertSafeTarget(url: string, write: boolean, writeProd: boolean) {
  if (!write) return;
  const host = new URL(url).hostname.toLowerCase();
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const normalized = host.startsWith('db.') ? host.slice(3) : host;
  if (!writeProd && prodHosts.some((prod) => normalized === prod.toLowerCase())) {
    throw new Error(`Refusing --write against production host "${host}". Pass --write-prod after review.`);
  }
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const xlsxPath = path.resolve('..', 'PVG Ring Designs with metal 2026 (1).xlsx');
  const publicDir = path.resolve('public', 'ring-designs');
  const outJson = path.resolve('scripts', 'legacy-import', 'ring-designs', 'parsed-designs.json');
  const outSql = path.resolve('supabase', 'migration_ring_designs_2026.sql');

  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`Excel file not found: ${xlsxPath}`);
  }

  console.log('Parsing ring designs from Excel...');
  const designs = parseRingDesignsFromFile(xlsxPath);
  console.log(`Found ${designs.length} designs`);

  console.log('Extracting design images...');
  const imageMap = extractDesignImages(xlsxPath, publicDir);
  console.log(`Copied ${imageMap.size} images to public/ring-designs/`);

  const records = buildDesignRecords(designs, imageMap);
  const sql = generateSqlSeed(records);

  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify({ designs, records }, null, 2));
  fs.writeFileSync(outSql, sql);
  console.log(`Wrote ${outJson}`);
  console.log(`Wrote ${outSql}`);

  const summary = {
    total: records.length,
    withSilver: records.filter((r) => r.making_charges.silver_925).length,
    withGold22k: records.filter((r) => r.estimated_metal_weight?.gold_22k).length,
    withDiamondCharges: records.filter((r) => Object.keys(r.diamond_charges).length > 0).length,
  };
  console.log('Summary:', summary);

  if (!flags.write) {
    console.log('\nDry run complete. Re-run with --write to upsert into Supabase.');
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --write');
  }
  assertSafeTarget(supabaseUrl, flags.write, flags.writeProd);

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('\nUpserting ring designs (preserves existing IDs referenced by orders)...');
  const { updated, inserted } = await upsertJewelryDesignRecords(supabase, records);
  console.log(`Updated ${updated}, inserted ${inserted} ring designs`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
