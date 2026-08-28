/**
 * Check Tag Stock rudraksha tags; activate (mark in_stock) any that are sold.
 *
 *   npx tsx scripts/db/_activate-tag-stock-rudraksha.ts
 *   npx tsx scripts/db/_activate-tag-stock-rudraksha.ts --write
 */
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true });

const WRITE = process.argv.includes('--write');

const TAGS = [
  'A457', 'B699', 'B919', 'B974', 'D266', 'D555', 'G412', 'J934',
  'N853', 'O560', 'T620', 'T909', 'V663', 'V815', 'W625', 'W969',
] as const;

function normalizeTag(value: unknown) {
  const cleaned = String(value ?? '').trim().toUpperCase().replace(/\.+$/, '').replace(/\s+/g, '');
  if (!cleaned) return '';
  const m = cleaned.match(/^([A-Z]+\d+[A-Z0-9]*)/);
  return m ? m[1] : cleaned;
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
  category: string | null;
  mukhi_count: number | null;
};

function preferRudraksha(a: ProductRow, b: ProductRow): ProductRow {
  const score = (p: ProductRow) => {
    let s = 0;
    const blob = `${p.category ?? ''} ${p.name ?? ''}`.toLowerCase();
    if (blob.includes('rudraksha')) s += 20;
    if (p.mukhi_count === 1 || blob.includes('1 mukhi') || blob.includes('1-mukhi')) s += 15;
    if (p.is_active) s += 4;
    if (normalizeTag(p.tag_number)) s += 2;
    return s;
  };
  return score(b) > score(a) ? b : a;
}

async function findProduct(sb: ReturnType<typeof createClient>, tag: string): Promise<ProductRow | null> {
  const sel = 'id,name,sku,tag_number,availability_status,in_stock,stock_quantity,is_active,category,mukhi_count';
  const [{ data: byTag }, { data: bySku }] = await Promise.all([
    sb.from('products').select(sel).ilike('tag_number', tag).is('deleted_at', null).limit(20),
    sb.from('products').select(sel).ilike('sku', `${tag}%`).is('deleted_at', null).limit(20),
  ]);
  const rows = [...((byTag ?? []) as ProductRow[]), ...((bySku ?? []) as ProductRow[])];
  const matches = rows.filter((p) => normalizeTag(p.tag_number) === tag || normalizeTag(p.sku) === tag);
  const uniq = [...new Map(matches.map((p) => [p.id, p])).values()];
  if (!uniq.length) return null;
  return uniq.reduce((best, row) => preferRudraksha(best, row));
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing supabase env');
  console.log('host', new URL(url).host, WRITE ? 'WRITE' : 'DRY-RUN');

  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const toActivate: Array<{ tag: string; id: string; name: string; was: string }> = [];
  const alreadyOk: string[] = [];
  const missing: string[] = [];

  const needsActivate = (p: ProductRow) => {
    const status = p.availability_status ?? '';
    if (status === 'in_stock' && p.in_stock && Number(p.stock_quantity) >= 1) return false;
    // ponytail: Tag Stock sheet = physically available; flip sold/reserved/out_of_stock back
    return ['sold', 'out_of_stock', 'reserved', 'archived'].includes(status) || !p.in_stock;
  };

  for (const tag of TAGS) {
    const p = await findProduct(sb, tag);
    if (!p) {
      missing.push(tag);
      console.log(`${tag}\tNOT FOUND`);
      continue;
    }
    const status = p.availability_status ?? '(null)';
    if (needsActivate(p)) {
      console.log(`${tag}\t${status.toUpperCase()} → will activate\t${p.name}`);
      toActivate.push({ tag, id: p.id, name: p.name, was: status });
    } else {
      console.log(`${tag}\tOK (in_stock)\t${p.name}`);
      alreadyOk.push(tag);
    }
  }

  console.log('\n--- summary ---');
  console.log('will activate:', toActivate.length);
  console.log('already in_stock:', alreadyOk.length);
  console.log('missing:', missing.length);

  if (!toActivate.length) {
    console.log('\nNothing to activate.');
    return;
  }

  if (!WRITE) {
    console.log('\nRe-run with --write to activate sold items.');
    return;
  }

  const now = new Date().toISOString();
  for (const { tag, id, name } of toActivate) {
    const { error } = await sb
      .from('products')
      .update({
        is_active: true,
        deleted_at: null,
        in_stock: true,
        stock_quantity: 1,
        stock_status: 'in_stock',
        availability_status: 'in_stock',
        manual_reserve_enabled: false,
        reserved_quantity: 0,
        reserved_by_admin_id: null,
        reserved_by_customer_id: null,
        reserved_until: null,
        reservation_note: 'Restored from Tag Stock — marked available',
        updated_at: now,
      })
      .eq('id', id);
    if (error) {
      console.error(`${tag}\tFAILED\t${error.message}`);
    } else {
      console.log(`${tag}\tACTIVATED\t${name}`);
    }
  }

  // ponytail: Tag Stock sheet means offline erp_stock=1 for rudraksha category
  for (const tag of TAGS) {
    await sb
      .from('erp_tag_stock')
      .upsert(
        { tgno: tag, erp_stock: 1, stock_category: 'rudraksha', synced_at: now },
        { onConflict: 'tgno' },
      );
  }
  console.log('\nUpdated erp_tag_stock → erp_stock=1 for all tags.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
