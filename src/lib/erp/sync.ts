import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import {
  estimateErpTagPrice,
  fetchTagStock,
  isErpConfigured,
  normalizeTagNumber,
} from '@/lib/erp/mmi-client';
import type {
  ErpMissingOnWebsite,
  ErpOrphanOnWebsite,
  ErpStockMismatch,
  ErpSyncReport,
  ErpTagStockRow,
} from '@/lib/erp/types';

const API_CALL_BUDGET = Number(process.env.MMI_ERP_API_CALL_BUDGET ?? 100);

type CachedErpTag = {
  tgno: string;
  tsno: number;
  ino: number | null;
  idesc: string | null;
  erp_stock: number;
  remarks: string | null;
  tpre: string | null;
  cost_damt: number | null;
  cost_samt: number | null;
  cost_mamt: number | null;
};

type WebsiteTaggedProduct = {
  id: string;
  tag_number: string | null;
  name: string;
  in_stock: boolean | null;
  stock_quantity: number | null;
  availability_status: string | null;
  is_active: boolean | null;
  sold_individually: boolean | null;
};

function isWebsitePurchasable(product: WebsiteTaggedProduct) {
  if (!product.is_active) return false;
  if (!product.in_stock) return false;
  if (product.availability_status === 'sold' || product.availability_status === 'reserved' || product.availability_status === 'archived' || product.availability_status === 'out_of_stock') {
    return false;
  }
  const qty = product.stock_quantity ?? 0;
  if (product.sold_individually) return qty > 0;
  return qty > 0;
}

function toDiffItem(row: CachedErpTag): ErpMissingOnWebsite {
  return {
    kind: 'missing_on_website',
    tgno: row.tgno,
    tsno: row.tsno,
    ino: row.ino,
    name: row.idesc ?? row.tgno,
    remarks: row.remarks,
    erpInStock: row.erp_stock === 1,
    estimatedPrice: Number(row.cost_damt ?? 0) + Number(row.cost_samt ?? 0) + Number(row.cost_mamt ?? 0),
  };
}

export function buildErpSyncReport(
  erpTags: CachedErpTag[],
  websiteProducts: WebsiteTaggedProduct[],
  meta: Pick<ErpSyncReport, 'syncedAt' | 'apiCallsUsed' | 'pendingOutbound'>
): ErpSyncReport {
  const erpByTag = new Map<string, CachedErpTag>();
  for (const row of erpTags) {
    const key = normalizeTagNumber(row.tgno);
    if (key) erpByTag.set(key, row);
  }

  const websiteByTag = new Map<string, WebsiteTaggedProduct>();
  for (const product of websiteProducts) {
    const key = normalizeTagNumber(product.tag_number);
    if (key && !websiteByTag.has(key)) websiteByTag.set(key, product);
  }

  const missingOnWebsite: ErpMissingOnWebsite[] = [];
  const stockMismatches: ErpStockMismatch[] = [];
  let matchedInStock = 0;

  for (const [tag, erpRow] of erpByTag) {
    const website = websiteByTag.get(tag);
    const erpInStock = erpRow.erp_stock === 1;

    if (!website) {
      if (erpInStock) missingOnWebsite.push(toDiffItem(erpRow));
      continue;
    }

    if (erpInStock) matchedInStock += 1;

    const websitePurchasable = isWebsitePurchasable(website);
    if (websitePurchasable !== erpInStock) {
      stockMismatches.push({
        kind: 'stock_mismatch',
        tgno: erpRow.tgno,
        productId: website.id,
        productName: website.name,
        websitePurchasable,
        erpInStock,
        availabilityStatus: website.availability_status ?? 'unknown',
        stockQuantity: website.stock_quantity,
      });
    }
  }

  const orphansOnWebsite: ErpOrphanOnWebsite[] = [];
  for (const [tag, product] of websiteByTag) {
    const erpRow = erpByTag.get(tag);
    const websitePurchasable = isWebsitePurchasable(product);

    if (!erpRow) {
      orphansOnWebsite.push({
        kind: 'orphan_on_website',
        productId: product.id,
        tagNumber: product.tag_number ?? tag,
        productName: product.name,
        websitePurchasable,
      });
      if (websitePurchasable) {
        stockMismatches.push({
          kind: 'stock_mismatch',
          tgno: product.tag_number ?? tag,
          productId: product.id,
          productName: product.name,
          websitePurchasable: true,
          erpInStock: false,
          availabilityStatus: product.availability_status ?? 'unknown',
          stockQuantity: product.stock_quantity,
        });
      }
    }
  }

  return {
    syncedAt: meta.syncedAt,
    apiCallsUsed: meta.apiCallsUsed,
    apiCallsRemaining: Math.max(0, API_CALL_BUDGET - meta.apiCallsUsed),
    erpTagCount: erpTags.length,
    websiteTaggedCount: websiteByTag.size,
    matchedInStock,
    missingOnWebsite: missingOnWebsite.sort((a, b) => a.tgno.localeCompare(b.tgno)),
    stockMismatches: stockMismatches.sort((a, b) => a.tgno.localeCompare(b.tgno)),
    orphansOnWebsite: orphansOnWebsite.sort((a, b) => a.tagNumber.localeCompare(b.tagNumber)),
    pendingOutbound: meta.pendingOutbound,
  };
}

async function readSyncMeta(db: ReturnType<typeof asUntypedSupabase>) {
  const { data: state } = await db.from('erp_sync_state').select('*').eq('id', 'mmi').maybeSingle();
  const { count: pendingOutbound } = await db
    .from('erp_outbound_queue')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  return {
    syncedAt: (state?.last_sync_at as string | null) ?? null,
    apiCallsUsed: Number(state?.api_calls_used ?? 0),
    pendingOutbound: pendingOutbound ?? 0,
  };
}

export async function getErpSyncReportFromCache(): Promise<ErpSyncReport> {
  const db = asUntypedSupabase(createAdminClient());
  const meta = await readSyncMeta(db);

  const [{ data: erpTags }, { data: websiteProducts }] = await Promise.all([
    db.from('erp_tag_stock').select('tgno, tsno, ino, idesc, erp_stock, remarks, tpre, cost_damt, cost_samt, cost_mamt'),
    db.from('products')
      .select('id, tag_number, name, in_stock, stock_quantity, availability_status, is_active, sold_individually')
      .not('tag_number', 'is', null)
      .neq('tag_number', ''),
  ]);

  return buildErpSyncReport(
    (erpTags ?? []) as CachedErpTag[],
    (websiteProducts ?? []) as WebsiteTaggedProduct[],
    meta
  );
}

function mapErpRows(rows: ErpTagStockRow[], stockFilter: 1 | 2) {
  return rows.map((row) => ({
    tgno: row.TGNO,
    tsno: row.tsno,
    ino: row.INO ?? null,
    idesc: row.IDESC ?? null,
    erp_stock: stockFilter,
    remarks: row.REMARKS ?? null,
    tpre: row.TPRE ?? null,
    cost_damt: row.COSTDAMT ?? null,
    cost_samt: row.COSTSAMT ?? null,
    cost_mamt: row.COSTMAMT ?? null,
    erp_data: row.raw ?? row,
    synced_at: new Date().toISOString(),
  }));
}

const UPSERT_BATCH = 250;

async function batchUpsertErpTags(db: ReturnType<typeof asUntypedSupabase>, rows: ReturnType<typeof mapErpRows>) {
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const batch = rows.slice(i, i + UPSERT_BATCH);
    const { error } = await db.from('erp_tag_stock').upsert(batch, { onConflict: 'tgno' });
    if (error) throw new Error(error.message ?? `Failed to cache ERP tags (batch ${i / UPSERT_BATCH + 1})`);
  }
}

export async function syncErpTagStockFromApi() {
  if (!isErpConfigured()) {
    throw new Error('MMI_ERP_API_TOKEN is not configured');
  }

  const db = asUntypedSupabase(createAdminClient());
  const { data: state } = await db.from('erp_sync_state').select('api_calls_used').eq('id', 'mmi').maybeSingle();
  const used = Number(state?.api_calls_used ?? 0);
  if (used + 1 > API_CALL_BUDGET) {
    throw new Error(`ERP API budget exceeded (${used}/${API_CALL_BUDGET}). Contact MMI to raise the limit.`);
  }

  // ponytail: one call (stock=1). Tags absent from in-stock ERP are treated as sold offline.
  const inStockRows = await fetchTagStock({ stock: 1 });
  const merged = mapErpRows(inStockRows, 1);
  const maxTsno = merged.reduce((max, row) => Math.max(max, row.tsno), 0);
  const now = new Date().toISOString();

  const { error: deleteError } = await db.from('erp_tag_stock').delete().neq('tgno', '');
  if (deleteError) throw new Error(deleteError.message ?? 'Failed to clear ERP tag cache');

  if (merged.length) {
    await batchUpsertErpTags(db, merged);
  }

  const { error: stateError } = await db
    .from('erp_sync_state')
    .upsert({
      id: 'mmi',
      api_calls_used: used + 1,
      last_sync_at: now,
      last_max_tsno: maxTsno,
      last_sync_error: null,
      updated_at: now,
    }, { onConflict: 'id' });

  if (stateError) throw new Error(stateError.message ?? 'Failed to update ERP sync state');

  return getErpSyncReportFromCache();
}

export async function applyErpStockToWebsite(productIds?: string[]) {
  const report = await getErpSyncReportFromCache();
  const targets = report.stockMismatches.filter((row) => !row.erpInStock && row.websitePurchasable);
  const selected = productIds?.length
    ? targets.filter((row) => productIds.includes(row.productId))
    : targets;

  const db = asUntypedSupabase(createAdminClient());
  const now = new Date().toISOString();
  let updated = 0;

  for (const row of selected) {
    const { data: product } = await db
      .from('products')
      .select('id, sold_individually')
      .eq('id', row.productId)
      .maybeSingle();

    const soldIndividually = Boolean(product?.sold_individually);
    const updates = soldIndividually
      ? {
          in_stock: false,
          stock_quantity: 0,
          stock_status: 'out_of_stock',
          availability_status: 'sold',
          updated_at: now,
        }
      : {
          in_stock: false,
          stock_quantity: 0,
          stock_status: 'out_of_stock',
          availability_status: 'out_of_stock',
          updated_at: now,
        };

    const { error } = await db.from('products').update(updates).eq('id', row.productId);
    if (!error) updated += 1;
  }

  return { updated, report: await getErpSyncReportFromCache() };
}

export async function queueErpOutboundSale(input: {
  tagNumber: string;
  orderId?: string | null;
  productId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const tag = normalizeTagNumber(input.tagNumber);
  if (!tag) return;

  const db = asUntypedSupabase(createAdminClient());
  await db.from('erp_outbound_queue').insert({
    tag_number: tag,
    action: 'mark_sold',
    order_id: input.orderId ?? null,
    product_id: input.productId ?? null,
    payload: input.payload ?? {},
    status: 'pending',
  });
}

export async function findCachedErpTag(db: ReturnType<typeof asUntypedSupabase>, tgno: string) {
  const key = normalizeTagNumber(tgno);
  if (!key) return null;

  const { data: rows } = await db
    .from('erp_tag_stock')
    .select('tgno, tsno, ino, idesc, erp_stock, remarks, tpre, cost_damt, cost_samt, cost_mamt')
    .ilike('tgno', tgno.trim());

  return ((rows ?? []) as CachedErpTag[]).find((row) => normalizeTagNumber(row.tgno) === key) ?? null;
}

export function slugifyForProduct(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180) || 'erp-item';
}

export function buildDraftProductFromErpTag(row: CachedErpTag) {
  const baseSlug = slugifyForProduct(`${row.idesc ?? 'item'}-${row.tgno}`);
  const price = estimateErpTagPrice({
    COSTDAMT: row.cost_damt ?? undefined,
    COSTSAMT: row.cost_samt ?? undefined,
    COSTMAMT: row.cost_mamt ?? undefined,
  });

  return {
    sku: `ERP-${row.tgno}`.slice(0, 50),
    name: row.idesc ?? `ERP item ${row.tgno}`,
    slug: baseSlug,
    category: 'jewelry',
    product_type: 'jewelry',
    tag_number: row.tgno,
    price,
    certificate_number: row.remarks?.trim() || undefined,
    in_stock: row.erp_stock === 1,
    stock_quantity: row.erp_stock === 1 ? 1 : 0,
    stock_status: row.erp_stock === 1 ? 'in_stock' : 'out_of_stock',
    availability_status: row.erp_stock === 1 ? 'in_stock' : 'out_of_stock',
    sold_individually: true,
    is_active: false,
    legacy_data: { erp: row },
  };
}

// ponytail: runnable self-check — `node -e "require('ts-node/register'); ..."` or vitest
export function __erpSyncSelfCheck() {
  const erpTags: CachedErpTag[] = [
    { tgno: 'DK1', tsno: 1, ino: 10, idesc: 'Diamond Bangle', erp_stock: 1, remarks: null, tpre: null, cost_damt: 1000, cost_samt: 0, cost_mamt: 0 },
    { tgno: 'DK2', tsno: 2, ino: 11, idesc: 'Sold Ring', erp_stock: 2, remarks: null, tpre: null, cost_damt: 0, cost_samt: 0, cost_mamt: 0 },
  ];
  const website: WebsiteTaggedProduct[] = [
    { id: 'p1', tag_number: 'dk1', name: 'Bangle', in_stock: true, stock_quantity: 1, availability_status: 'in_stock', is_active: true, sold_individually: true },
    { id: 'p2', tag_number: 'WEB-ONLY', name: 'Website only', in_stock: true, stock_quantity: 1, availability_status: 'in_stock', is_active: true, sold_individually: true },
  ];
  const report = buildErpSyncReport(erpTags, website, { syncedAt: null, apiCallsUsed: 2, pendingOutbound: 0 });
  console.assert(report.missingOnWebsite.length === 0, 'DK1 is on website');
  console.assert(report.stockMismatches.some((row) => row.tgno === 'DK2') === false, 'DK2 not on website yet');
  console.assert(report.orphansOnWebsite.length === 1, 'WEB-ONLY is orphan');
}
