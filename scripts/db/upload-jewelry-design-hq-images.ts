/**
 * Upload HQ design images from ../designsimageshigh using filename design numbers.
 * Design-N rows map to files like "ring design No-N", "Gemstone Pandat Deisign No-N", etc.
 *
 * Dry run:  npx tsx scripts/db/upload-jewelry-design-hq-images.ts
 * Apply:    npx tsx scripts/db/upload-jewelry-design-hq-images.ts --write
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Client } from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const hqDir = resolve(repoRoot, '..', 'designsimageshigh');
const BUCKET = 'jewelry-designs';

loadEnv({ path: resolve(repoRoot, '.env.local') });

type DesignRow = {
  id: string;
  name: string;
  setting_type: string;
  product_scope: string;
  sort_order: number;
  image_url: string | null;
};

type HqCategory = 'ring' | 'pendant' | 'bracelet' | 'rudraksha';

type HqFile = {
  path: string;
  name: string;
  size: number;
  designNumber: number;
  category: HqCategory;
};

type MatchResult = {
  design: DesignRow;
  hqFile: string;
  designNumber: number | null;
  oldUrl: string | null;
  newUrl?: string;
  status: 'matched' | 'uploaded' | 'skipped' | 'no_match';
  reason?: string;
};

/** Legacy rudraksha public/design-N.jpeg order → HQ filename (numbers in HQ names do not match N). */
const RUDRAKSHA_HQ_BY_LEGACY_INDEX: Record<number, string> = {
  1: 'ONE MUKHI-1340x1140.jpg',
  2: 'FOR IN ONE RUDRAKSHA PANDANT copy.jpg',
  3: 'rudraksha pandant-1340x1140-3.jpg',
  4: 'rudraksha pandant-1340x1140-8.jpg',
  5: 'rudraksha gemstone pandent.jpg',
  6: 'rudraksha pandant-1340x1140-10.jpg',
  7: 'rudraksha pandant-1340x1140-9.jpg',
  8: 'rudraksha pandant-1340x1140 copy.jpg',
  9: 'rudraksha pandant-1340x1140-1.jpg',
  10: 'rudraksha pandant-1340x1140-2.jpg',
};

function resolveDbUrl() {
  return process.env.DATABASE_URL || process.env.LEGACY_IMPORT_DATABASE_URL;
}

function categorizeHqFile(name: string): HqCategory | null {
  const lower = name.toLowerCase();
  if (lower.includes('rudraksha') || lower.includes('one mukhi') || lower.includes('one rudraksha')) {
    return 'rudraksha';
  }
  if (lower.includes('bracelete')) return 'bracelet';
  if (lower.includes('pandat deisign')) return 'pendant';
  if (lower.includes('ring design')) return 'ring';
  return null;
}

function extractDesignNumber(name: string, category: HqCategory): number | null {
  const lower = name.toLowerCase();

  if (category === 'ring') {
    const pngMatch = lower.match(/ring design (\d+)\.png(?:\.|$|\s)/);
    if (pngMatch) return Number.parseInt(pngMatch[1]!, 10);

    const noMatch = lower.match(/ring design no-(\d+)(?:[^0-9]|$)/);
    if (noMatch) return Number.parseInt(noMatch[1]!, 10);
    return null;
  }

  if (category === 'pendant') {
    const m = lower.match(/pandat deisign n[o0]-?(\d+)(?:[^0-9]|$)/);
    if (m) return Number.parseInt(m[1]!, 10);
    return null;
  }

  if (category === 'bracelet') {
    const m = lower.match(/bracelete deisigns no-?(\d+)(?:[^0-9]|$)/);
    if (m) return Number.parseInt(m[1]!, 10);
    return null;
  }

  return null;
}

function designNumberFromRow(row: DesignRow): number | null {
  const byName = row.name.match(/^Design-(\d+)$/i);
  if (byName) return Number.parseInt(byName[1]!, 10);

  if (row.product_scope === 'rudraksha' && row.sort_order > 0) {
    return row.sort_order;
  }

  const byUrl = row.image_url?.match(/design-(\d+)\.[a-z0-9]+(?:\?|$)/i);
  if (byUrl) return Number.parseInt(byUrl[1]!, 10);

  return null;
}

function hqCategoryForDesign(row: DesignRow): HqCategory | null {
  if (row.product_scope === 'rudraksha') return 'rudraksha';
  if (row.setting_type === 'ring') return 'ring';
  if (row.setting_type === 'bracelet') return 'bracelet';
  if (row.setting_type === 'pendant') return 'pendant';
  return null;
}

function indexHqFiles(): {
  byCategoryAndNumber: Map<HqCategory, Map<number, HqFile>>;
  byName: Map<string, string>;
  all: HqFile[];
} {
  const byCategoryAndNumber = new Map<HqCategory, Map<number, HqFile>>();
  const byName = new Map<string, string>();
  const all: HqFile[] = [];

  const names = readdirSync(hqDir).filter((n) => /\.(jpe?g|png|webp)$/i.test(n));

  for (const name of names) {
    const path = resolve(hqDir, name);
    byName.set(name.toLowerCase(), path);

    const category = categorizeHqFile(name);
    if (!category || category === 'rudraksha') continue;

    const designNumber = extractDesignNumber(name, category);
    if (designNumber == null) continue;

    const size = readFileSync(path).length;
    const file: HqFile = { path, name, size, designNumber, category };

    const bucket = byCategoryAndNumber.get(category) ?? new Map<number, HqFile>();
    const existing = bucket.get(designNumber);
    if (!existing || file.size > existing.size) {
      bucket.set(designNumber, file);
    }
    byCategoryAndNumber.set(category, bucket);
    all.push(file);
  }

  return { byCategoryAndNumber, byName, all };
}

function pickHqFile(
  row: DesignRow,
  index: ReturnType<typeof indexHqFiles>,
): HqFile | null {
  const designNumber = designNumberFromRow(row);
  if (designNumber == null) return null;

  if (row.product_scope === 'rudraksha') {
    const mappedName = RUDRAKSHA_HQ_BY_LEGACY_INDEX[designNumber];
    if (!mappedName) return null;
    const path = index.byName.get(mappedName.toLowerCase());
    if (!path) return null;
    return {
      path,
      name: mappedName,
      size: readFileSync(path).length,
      designNumber,
      category: 'rudraksha',
    };
  }

  const category = hqCategoryForDesign(row);
  if (!category) return null;

  return index.byCategoryAndNumber.get(category)?.get(designNumber) ?? null;
}

function mimeForExt(ext: string): string {
  const lower = ext.toLowerCase();
  if (lower === '.png') return 'image/png';
  if (lower === '.webp') return 'image/webp';
  return 'image/jpeg';
}

async function uploadDesignImage(
  supabase: SupabaseClient,
  row: DesignRow,
  filePath: string,
): Promise<string> {
  const ext = extname(filePath).toLowerCase() || '.jpg';
  const storagePath = `published/${row.setting_type}/${row.id}/hero${ext}`;
  const body = readFileSync(filePath);

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, body, {
    contentType: mimeForExt(ext),
    cacheControl: '31536000',
    upsert: true,
  });

  if (error) throw new Error(`Upload failed for ${row.name}: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return `${data.publicUrl}?v=${Date.now()}`;
}

async function fetchDesigns(client: Client): Promise<DesignRow[]> {
  const { rows } = await client.query<DesignRow>(`
    SELECT id, name, setting_type, product_scope, sort_order, image_url
    FROM jewelry_designs
    WHERE is_active = true
    ORDER BY setting_type, sort_order, name
  `);
  return rows;
}

async function main() {
  const write = process.argv.includes('--write');

  if (!existsSync(hqDir)) {
    throw new Error(`HQ folder not found: ${hqDir}`);
  }

  const dbUrl = resolveDbUrl();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dbUrl) throw new Error('Missing DATABASE_URL');
  if (write && (!supabaseUrl || !serviceKey)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for --write');
  }

  console.log('Indexing HQ images by design number...');
  const hqIndex = indexHqFiles();
  console.log(`Indexed ${hqIndex.all.length} numbered HQ files from ${hqDir}`);

  const pg = new Client({ connectionString: dbUrl });
  await pg.connect();

  const designs = await fetchDesigns(pg);
  const results: MatchResult[] = [];
  const supabase = write ? createClient(supabaseUrl!, serviceKey!) : null;

  for (const design of designs) {
    const designNumber = designNumberFromRow(design);
    const hqFile = pickHqFile(design, hqIndex);

    if (!hqFile) {
      results.push({
        design,
        hqFile: '',
        designNumber,
        oldUrl: design.image_url,
        status: 'no_match',
        reason:
          designNumber == null
            ? 'Could not parse design number from name/url'
            : `No HQ file for ${hqCategoryForDesign(design) ?? 'unknown'} design #${designNumber}`,
      });
      continue;
    }

    const entry: MatchResult = {
      design,
      hqFile: hqFile.path,
      designNumber,
      oldUrl: design.image_url,
      status: 'matched',
    };

    if (!write) {
      results.push(entry);
      continue;
    }

    try {
      const publicUrl = await uploadDesignImage(supabase!, design, hqFile.path);
      await pg.query(`UPDATE jewelry_designs SET image_url = $1 WHERE id = $2`, [
        publicUrl,
        design.id,
      ]);
      entry.newUrl = publicUrl;
      entry.status = 'uploaded';
      results.push(entry);
    } catch (err) {
      entry.status = 'skipped';
      entry.reason = err instanceof Error ? err.message : 'Upload failed';
      results.push(entry);
    }
  }

  await pg.end();

  const summary = {
    total: results.length,
    matched: results.filter((r) => r.status === 'matched').length,
    uploaded: results.filter((r) => r.status === 'uploaded').length,
    no_match: results.filter((r) => r.status === 'no_match').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
  };

  const manifestPath = resolve(here, 'jewelry-design-hq-upload-manifest.json');
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        matchStrategy: 'filename_design_number',
        write,
        summary,
        results: results.map((r) => ({
          id: r.design.id,
          name: r.design.name,
          setting_type: r.design.setting_type,
          product_scope: r.design.product_scope,
          designNumber: r.designNumber,
          hqFile: r.hqFile ? basename(r.hqFile) : null,
          oldUrl: r.oldUrl,
          newUrl: r.newUrl ?? null,
          status: r.status,
          reason: r.reason ?? null,
        })),
      },
      null,
      2,
    ),
  );

  console.log('\nSummary:', summary);
  console.log(`Manifest: ${manifestPath}`);

  if (!write) {
    console.log('\nDry run only. Re-run with --write to upload and update the database.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
