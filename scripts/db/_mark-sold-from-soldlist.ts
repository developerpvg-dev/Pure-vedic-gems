/**
 * Mark website products sold from soldlist/*.xlsx issue registers.
 *
 *   npx tsx scripts/db/_mark-sold-from-soldlist.ts --dir sold2025-26
 *   npx tsx scripts/db/_mark-sold-from-soldlist.ts --dir sold2025-26 --write
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true });

const WRITE = process.argv.includes('--write');
const dirIdx = process.argv.indexOf('--dir');
const subDir = dirIdx >= 0 ? process.argv[dirIdx + 1] : 'sold2025-26';
const SOLDLIST_DIR = resolve(process.cwd(), '..', 'soldlist', subDir);

/** Filename → category/name hints used to pick the right SKU when tags collide. */
function categoryHints(filename: string): string[] {
  const f = filename.toLowerCase();
  // ponytail: sold24-25 file is misspelled RUSRAKSHA
  if (f.includes('rudraksha') || f.includes('rusraksha')) return ['rudraksha'];
  if (f.includes('pooja') || f.includes('idol')) return ['rudraksha', 'pooja', 'idol'];
  if (f.includes('emerald')) return ['navaratna', 'emerald'];
  if (f.includes('ruby')) return ['navaratna', 'ruby'];
  if (f.includes('sapphire')) return ['navaratna', 'sapphire'];
  if (f.includes('semi')) return ['uparatna', 'semi'];
  if (f.includes('pre stone') || f.includes('pre ston') || f.includes('pre stn')) {
    return ['navaratna', 'uparatna', 'pearl', 'coral', 'opal', 'zircon', 'hessonite', 'cats'];
  }
  return [];
}

function normalizeTag(value: unknown) {
  const cleaned = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\.+$/, '')
    .replace(/\s+/g, '');
  if (!cleaned) return '';
  const m = cleaned.match(/^([A-Z]+\d+[A-Z0-9]*)/);
  return m ? m[1] : '';
}

function effectiveTag(p: { tag_number?: string | null; sku?: string | null }) {
  return normalizeTag(p.tag_number) || normalizeTag(p.sku);
}

function isTagHeader(cell: unknown) {
  const s = String(cell ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  return s === 'tag.no.' || s === 'tag.no' || s === 'tagno' || s === 'tgno';
}

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  tag_number: string | null;
  availability_status: string | null;
  in_stock: boolean | null;
  stock_quantity: number | null;
  is_active: boolean | null;
  sold_individually: boolean | null;
  category: string | null;
  price_mode?: string | null;
};

function prefer(a: ProductRow, b: ProductRow, hints: string[]): ProductRow {
  const score = (p: ProductRow) => {
    let s = 0;
    if (p.is_active) s += 8;
    if (normalizeTag(p.tag_number)) s += 2;
    if (p.sku && !/^ERP-/i.test(String(p.sku).trim())) s += 1;
    const blob = `${p.category ?? ''} ${p.name ?? ''}`.toLowerCase();
    if (hints.some((h) => blob.includes(h))) s += 12;
    // Prefer unique stocked pieces over on-demand catalog shells
    if (p.availability_status === 'on_demand' || p.price_mode === 'on_demand') s -= 20;
    if (p.availability_status === 'in_stock' || p.in_stock) s += 4;
    if (p.availability_status === 'reserved') s += 3;
    if (p.availability_status === 'out_of_stock') s += 1;
    if (p.availability_status === 'sold') s -= 2;
    if (p.availability_status === 'archived') s -= 4;
    return s;
  };
  return score(b) > score(a) ? b : a;
}

function extractTagsFromWorkbook(filename: string, buffer: Buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const tags = new Set<string>();
  const sheetStats: Array<{ sheet: string; tags: number; header: boolean }> = [];

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    let headerIdx = -1;
    let tagCol = -1;
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const r = rows[i];
      if (!Array.isArray(r)) continue;
      const idx = r.findIndex(isTagHeader);
      if (idx >= 0) {
        headerIdx = i;
        tagCol = idx;
        break;
      }
    }
    let count = 0;
    if (headerIdx >= 0) {
      for (const r of rows.slice(headerIdx + 1)) {
        if (!Array.isArray(r)) continue;
        const t = normalizeTag(r[tagCol]);
        if (!t) continue;
        tags.add(t);
        count += 1;
      }
    }
    sheetStats.push({ sheet: sheetName, tags: count, header: headerIdx >= 0 });
  }

  return { filename, tags: [...tags].sort(), sheetStats };
}

// ponytail: one-off script — don't couple to supabase generic variance (breaks next build)
async function findProduct(
  sb: { from: (table: string) => any },
  tag: string,
  hints: string[],
): Promise<ProductRow | null> {
  const sel =
    'id,name,sku,tag_number,availability_status,in_stock,stock_quantity,is_active,sold_individually,category,price_mode';
  const [{ data: byTag }, { data: bySku }] = await Promise.all([
    sb.from('products').select(sel).ilike('tag_number', tag).limit(20),
    sb.from('products').select(sel).ilike('sku', `${tag}%`).limit(20),
  ]);
  const rows = [...((byTag ?? []) as ProductRow[]), ...((bySku ?? []) as ProductRow[])];
  const matches = rows.filter((p) => effectiveTag(p) === tag);
  const uniq = [...new Map(matches.map((p) => [p.id, p])).values()];
  if (!uniq.length) return null;
  return uniq.reduce((best, row) => prefer(best, row, hints));
}

function isOnDemand(p: ProductRow) {
  return p.availability_status === 'on_demand' || p.price_mode === 'on_demand';
}

function alreadySold(p: ProductRow) {
  return (
    p.availability_status === 'sold' &&
    p.in_stock === false &&
    Number(p.stock_quantity ?? 0) === 0
  );
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing supabase env');
  console.log('host', new URL(url).host, WRITE ? 'WRITE' : 'DRY-RUN');
  console.log('dir', SOLDLIST_DIR);

  const files = readdirSync(SOLDLIST_DIR).filter((f) => /\.xlsx?$/i.test(f));
  if (!files.length) throw new Error('No excel files in soldlist');

  // tag -> { files, hints } — if a tag appears in multiple files, merge hints
  const allTags = new Map<string, { files: string[]; hints: string[] }>();
  for (const f of files) {
    const parsed = extractTagsFromWorkbook(f, readFileSync(resolve(SOLDLIST_DIR, f)));
    const hints = categoryHints(f);
    console.log('\nFILE', f, 'hints=', hints.join('|') || '(none)');
    for (const s of parsed.sheetStats) {
      console.log(' ', s.sheet, s.header ? `tags=${s.tags}` : 'no Tag.No. header');
    }
    console.log('  unique tags', parsed.tags.length);
    for (const t of parsed.tags) {
      const prev = allTags.get(t) ?? { files: [], hints: [] };
      prev.files.push(f);
      for (const h of hints) if (!prev.hints.includes(h)) prev.hints.push(h);
      allTags.set(t, prev);
    }
  }

  const tags = [...allTags.keys()].sort();
  console.log('\nTOTAL unique tags across soldlist:', tags.length);

  const sb = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const summary = {
    missing: [] as string[],
    alreadySold: [] as Array<{ tag: string; name: string }>,
    skippedOnDemand: [] as Array<{ tag: string; name: string }>,
    toMark: [] as Array<{ tag: string; id: string; name: string; was: string | null }>,
    marked: [] as string[],
    errors: [] as Array<{ tag: string; error: string }>,
  };

  for (const tag of tags) {
    const meta = allTags.get(tag)!;
    const product = await findProduct(sb, tag, meta.hints);
    if (!product) {
      summary.missing.push(tag);
      continue;
    }
    if (alreadySold(product)) {
      summary.alreadySold.push({ tag, name: product.name });
      continue;
    }
    // ponytail: on-demand rows are catalog shells sharing a tag — don't kill the listing
    if (isOnDemand(product)) {
      summary.skippedOnDemand.push({ tag, name: product.name });
      continue;
    }
    summary.toMark.push({
      tag,
      id: product.id,
      name: product.name,
      was: product.availability_status,
    });

    if (!WRITE) continue;

    const now = new Date().toISOString();
    const { error } = await sb
      .from('products')
      .update({
        in_stock: false,
        stock_quantity: 0,
        stock_status: 'out_of_stock',
        availability_status: 'sold',
        reserved_until: null,
        reserved_quantity: 0,
        reservation_note: null,
        updated_at: now,
      })
      .eq('id', product.id);
    if (error) {
      summary.errors.push({ tag, error: error.message });
      continue;
    }

    await sb.from('erp_tag_stock').upsert(
      {
        tgno: tag,
        tsno: 0,
        ino: null,
        idesc: product.name,
        erp_stock: 2,
        remarks: null,
        tpre: null,
        cost_damt: null,
        cost_samt: null,
        cost_mamt: null,
        stock_category: null,
        erp_data: { source: 'soldlist_excel', TGNO: tag, files: meta.files },
        synced_at: now,
      },
      { onConflict: 'tgno' }
    );
    summary.marked.push(tag);
  }

  console.log('\n=== SUMMARY ===');
  console.log('unique tags', tags.length);
  console.log('missing on website', summary.missing.length);
  console.log('already sold', summary.alreadySold.length);
  console.log('skipped on-demand', summary.skippedOnDemand.length);
  console.log('need mark sold', summary.toMark.length);
  console.log('marked now', summary.marked.length);
  console.log('errors', summary.errors.length);

  if (summary.toMark.length) {
    console.log('\nTO MARK (first 40):');
    for (const row of summary.toMark.slice(0, 40)) {
      console.log(`  ${row.tag}  was=${row.was}  ${row.name}`);
    }
    if (summary.toMark.length > 40) console.log(`  … +${summary.toMark.length - 40} more`);
  }
  if (summary.skippedOnDemand.length) {
    console.log('\nSKIPPED ON-DEMAND:');
    for (const row of summary.skippedOnDemand) console.log(`  ${row.tag}  ${row.name}`);
  }
  if (summary.missing.length) {
    console.log('\nMISSING (first 40):');
    console.log(' ', summary.missing.slice(0, 40).join(', '));
  }
  if (summary.errors.length) {
    console.log('\nERRORS:');
    for (const e of summary.errors) console.log(' ', e.tag, e.error);
  }
  if (!WRITE) console.log('\nRe-run with --write to apply.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
