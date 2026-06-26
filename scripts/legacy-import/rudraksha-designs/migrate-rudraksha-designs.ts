import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  buildRudrakshaRecords,
  extractRudrakshaImages,
  generateRudrakshaSqlSeed,
  parseRudrakshaDesignsFromFile,
} from './parse-rudraksha-designs';
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
  const xlsxPath = path.resolve('..', 'pandant design pvg2026 (3).xlsx');
  const publicDir = path.resolve('public', 'rudraksha-designs');
  const outJson = path.resolve('scripts', 'legacy-import', 'rudraksha-designs', 'parsed-designs.json');
  const outSql = path.resolve('supabase', 'migration_rudraksha_designs_2026.sql');

  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`Excel file not found: ${xlsxPath}`);
  }

  console.log('Parsing rudraksha jewelry designs from Excel Sheet1...');
  const designs = parseRudrakshaDesignsFromFile(xlsxPath);
  console.log(`Found ${designs.length} rudraksha designs`);
  designs.forEach((design) => {
    console.log(`  ${design.sortOrder}. ${design.name}`);
  });

  console.log('Extracting design images...');
  const imageMap = extractRudrakshaImages(xlsxPath, publicDir);
  console.log(`Copied ${imageMap.size} images to public/rudraksha-designs/`);

  const records = buildRudrakshaRecords(designs, imageMap);
  const sql = generateRudrakshaSqlSeed(records);

  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify({ designs, records }, null, 2));
  fs.writeFileSync(outSql, sql);
  console.log(`Wrote ${outJson}`);
  console.log(`Wrote ${outSql}`);

  const summary = {
    total: records.length,
    withSilver: records.filter((r) => r.making_charges.silver_925).length,
    withGold22k: records.filter((r) => r.estimated_metal_weight?.gold_22k).length,
    withImages: records.filter((r) => r.image_url).length,
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

  console.log('\nUpserting rudraksha designs (preserves existing IDs referenced by orders)...');
  const { updated, inserted } = await upsertJewelryDesignRecords(supabase, records);
  console.log(`Updated ${updated}, inserted ${inserted} rudraksha designs`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
