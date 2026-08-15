/**
 * Report products marked sold in this chat session (order 00030 + soldlist).
 *   npx tsx scripts/db/_report-sold-this-chat.ts
 */
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true });

const ORDER_TAGS = ['F098', 'Y216', 'O723'] as const;

function normalizeTag(value: string | null | undefined) {
  const cleaned = (value ?? '').trim().toUpperCase().replace(/\.+$/, '').replace(/\s+/g, '');
  if (!cleaned) return '';
  const m = cleaned.match(/^([A-Z]+\d+[A-Z0-9]*)/);
  return m ? m[1] : cleaned;
}

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Order PVG-2026-00030 sold tags
  console.log('=== A) Order #PVG-2026-00030 — marked sold ===\n');
  for (const tag of ORDER_TAGS) {
    const { data } = await sb
      .from('products')
      .select('sku,name,availability_status,price,category')
      .ilike('sku', `${tag}%`)
      .limit(10);
    const rows = (data ?? []).filter((p) => normalizeTag(p.sku) === tag);
    const rudra = rows.find((p) => String(p.name).toLowerCase().includes('rudraksha')) ?? rows[0];
    if (!rudra) {
      console.log(`${tag}\t(not found)`);
      continue;
    }
    console.log(`${tag}\t${rudra.name}\t₹${rudra.price}\t${rudra.availability_status}\t${rudra.category}`);
  }

  // 2) soldlist excel marks
  const { data: erpRows, error } = await sb
    .from('erp_tag_stock')
    .select('tgno, idesc, erp_data, synced_at')
    .contains('erp_data', { source: 'soldlist_excel' })
    .order('tgno');
  if (error) throw error;

  const tags = (erpRows ?? []).map((r) => r.tgno as string);
  console.log(`\n=== B) soldlist Excels — marked sold (${tags.length}) ===\n`);

  // Fetch current product rows for those tags (batched by sku prefix is hard; do in chunks of lookups via erp idesc + product query)
  const products: Array<{
    tag: string;
    name: string;
    sku: string;
    price: number;
    category: string | null;
    availability_status: string | null;
    files: string[];
  }> = [];

  for (const row of erpRows ?? []) {
    const tag = String(row.tgno);
    const files = ((row.erp_data as { files?: string[] } | null)?.files ?? []) as string[];
    const { data } = await sb
      .from('products')
      .select('sku,name,price,category,availability_status,tag_number')
      .or(`sku.ilike.${tag}%,tag_number.ilike.${tag}`)
      .limit(20);
    const matches = (data ?? []).filter(
      (p) => normalizeTag(p.tag_number) === tag || normalizeTag(p.sku) === tag
    );
    // Prefer sold / matching idesc
    const idesc = String(row.idesc ?? '');
    const pick =
      matches.find((p) => p.name === idesc) ||
      matches.find((p) => p.availability_status === 'sold') ||
      matches[0];
    products.push({
      tag,
      name: pick?.name ?? idesc ?? '(missing)',
      sku: pick?.sku ?? tag,
      price: Number(pick?.price ?? 0),
      category: pick?.category ?? null,
      availability_status: pick?.availability_status ?? null,
      files,
    });
  }

  products.sort((a, b) => a.tag.localeCompare(b.tag));

  console.log('Tag\tName\tPrice\tCategory\tStatus\tSource file(s)');
  for (const p of products) {
    console.log(
      `${p.tag}\t${p.name}\t₹${p.price}\t${p.category ?? ''}\t${p.availability_status}\t${p.files.join(' | ')}`
    );
  }

  // Also write markdown report to soldlist folder
  const { writeFileSync } = await import('node:fs');
  const outPath = resolve(process.cwd(), '..', 'soldlist', 'MARKED-SOLD-REPORT.md');
  const lines: string[] = [];
  lines.push('# Products marked sold (this chat)');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## A) Order #PVG-2026-00030');
  lines.push('');
  lines.push('| Tag | Product | Price | Status |');
  lines.push('|-----|---------|------:|--------|');
  for (const tag of ORDER_TAGS) {
    const { data } = await sb
      .from('products')
      .select('sku,name,availability_status,price')
      .ilike('sku', `${tag}%`)
      .limit(10);
    const rows = (data ?? []).filter((p) => normalizeTag(p.sku) === tag);
    const rudra = rows.find((p) => String(p.name).toLowerCase().includes('rudraksha')) ?? rows[0];
    if (rudra) {
      lines.push(
        `| ${tag} | ${rudra.name} | ₹${rudra.price} | ${rudra.availability_status} |`
      );
    }
  }
  lines.push('');
  lines.push(`## B) soldlist Excels (${products.length} marked)`);
  lines.push('');
  lines.push('| Tag | Product | Price | Category | Status | Source file |');
  lines.push('|-----|---------|------:|----------|--------|-------------|');
  for (const p of products) {
    lines.push(
      `| ${p.tag} | ${p.name} | ₹${p.price} | ${p.category ?? ''} | ${p.availability_status} | ${p.files.join(', ')} |`
    );
  }
  lines.push('');
  lines.push('## Totals');
  lines.push('');
  lines.push(`- Order #PVG-2026-00030: ${ORDER_TAGS.length}`);
  lines.push(`- soldlist Excels: ${products.length}`);
  lines.push(`- **Grand total: ${ORDER_TAGS.length + products.length}**`);
  lines.push('');
  lines.push('### Not marked (from soldlist dry-run notes)');
  lines.push('');
  lines.push('- Already sold before run: 2');
  lines.push('- Skipped on-demand catalog shells (11): A812, B761, C317, D538, F081, P105, Q498, Q705, W040, W276, Y083');
  lines.push(
    '- Missing on website (27): A325, A385, B076, B716, C136, C653, E561, F822, J924, K078, K320, K817, N253, N270, N589, O073, O228, O645, P434, P470, P679, S143, T852, V315, V953, W008, Y682'
  );

  writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`\nWrote ${outPath}`);
  console.log(`\nTOTALS: order=${ORDER_TAGS.length} soldlist=${products.length} grand=${ORDER_TAGS.length + products.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
