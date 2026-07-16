import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { effectiveProductTag, estimateErpTagPrice, normalizeTagNumber } from '@/lib/erp/erp-utils';
import { enrichErpTagDetail, buildPrefillFromErpRow } from '@/lib/erp/enrich-tag';
import { parseMmiStockExcels, type ExcelStockRow } from '@/lib/erp/excel-import';
import { notifyStockManagers, notifyStockManagersAfterExcelSync } from '@/lib/erp/notify-stock';
import { getStockCategory, STOCK_CATEGORIES, type StockCategoryId } from '@/lib/erp/stock-categories';
import type { FormKind } from '@/components/admin/product-form/kinds';
import { KIND_CONFIGS } from '@/components/admin/product-form/kinds';
import type {
  ErpCategoryCoverage,
  ErpMissingOnWebsite,
  ErpOrphanOnWebsite,
  ErpOutboundTask,
  ErpStockMismatch,
  ErpSyncReport,
  ErpTagDetail,
  ErpTagDetailWebsite,
} from '@/lib/erp/types';

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
  stock_category?: string | null;
  synced_at?: string | null;
};

type WebsiteTaggedProduct = {
  id: string;
  tag_number: string | null;
  sku?: string | null;
  name: string;
  in_stock: boolean | null;
  stock_quantity: number | null;
  availability_status: string | null;
  price_mode?: string | null;
  is_active: boolean | null;
  sold_individually: boolean | null;
  category?: string | null;
  product_type?: string | null;
};

export type WebsiteAvailabilityAction = 'sold' | 'reserved';

function isWebsitePurchasable(product: WebsiteTaggedProduct) {
  if (!product.is_active) return false;
  if (
    product.availability_status === 'sold' ||
    product.availability_status === 'reserved' ||
    product.availability_status === 'archived' ||
    product.availability_status === 'out_of_stock'
  ) {
    return false;
  }
  // On-demand is still sellable on the site (made to order) — not "sold out"
  if (product.availability_status === 'on_demand' || product.price_mode === 'on_demand') return true;
  if (!product.in_stock) return false;
  const qty = product.stock_quantity ?? 0;
  return qty > 0;
}

/** Unique Excel inventory only — on-demand shouldn't enter sold-online / sold-offline diffs. */
function isExcelStockComparable(product: WebsiteTaggedProduct) {
  return product.availability_status !== 'on_demand' && product.price_mode !== 'on_demand';
}

/** When several products share a tag (e.g. ERP draft + live SKU), pick the real storefront one. */
function websiteProductMatchScore(product: WebsiteTaggedProduct) {
  let score = 0;
  if (product.is_active) score += 8;
  if (isWebsitePurchasable(product)) score += 4;
  if (normalizeTagNumber(product.tag_number)) score += 2;
  // ponytail: create-draft from Excel uses ERP-{tag}; prefer migrated/live SKUs over that draft
  if (product.sku && !/^ERP-/i.test(product.sku.trim())) score += 1;
  return score;
}

function preferWebsiteProductForTag(a: WebsiteTaggedProduct, b: WebsiteTaggedProduct) {
  const scoreA = websiteProductMatchScore(a);
  const scoreB = websiteProductMatchScore(b);
  if (scoreB !== scoreA) return scoreB > scoreA ? b : a;
  // stable: prefer earlier id only as tie-break via name length / id
  return (a.id || '') <= (b.id || '') ? a : b;
}

function setWebsiteByTag(
  map: Map<string, WebsiteTaggedProduct>,
  product: WebsiteTaggedProduct
) {
  const key = effectiveProductTag(product);
  if (!key) return;
  const existing = map.get(key);
  map.set(key, existing ? preferWebsiteProductForTag(existing, product) : product);
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
    stockCategory: row.stock_category ?? null,
  };
}

export function buildErpSyncReport(
  erpTags: CachedErpTag[],
  websiteProducts: WebsiteTaggedProduct[],
  meta: Pick<ErpSyncReport, 'syncedAt' | 'pendingOutbound'> & { apiCallsUsed?: number }
): ErpSyncReport {
  const erpByTag = new Map<string, CachedErpTag>();
  for (const row of erpTags) {
    const key = normalizeTagNumber(row.tgno);
    if (key) erpByTag.set(key, row);
  }

  const websiteByTag = new Map<string, WebsiteTaggedProduct>();
  for (const product of websiteProducts) {
    setWebsiteByTag(websiteByTag, product);
  }

  const missingOnWebsite: ErpMissingOnWebsite[] = [];
  const stockMismatches: ErpStockMismatch[] = [];
  let matchedInStock = 0;

  for (const [tag, erpRow] of erpByTag) {
    const website = websiteByTag.get(tag);
    const erpInStock = erpRow.erp_stock === 1;

    if (!website) {
      if (erpInStock && erpRow.stock_category) missingOnWebsite.push(toDiffItem(erpRow));
      continue;
    }

    const websitePurchasable = isWebsitePurchasable(website);
    if (erpInStock) matchedInStock += 1;

    // Only compare unique inventory vs Excel — skip on-demand (not a one-off sold item)
    if (
      erpRow.stock_category &&
      isExcelStockComparable(website) &&
      websitePurchasable !== erpInStock
    ) {
      stockMismatches.push({
        kind: 'stock_mismatch',
        tgno: erpRow.tgno,
        productId: website.id,
        productName: website.name,
        websitePurchasable,
        erpInStock,
        availabilityStatus: website.availability_status ?? 'unknown',
        stockQuantity: website.stock_quantity,
        stockCategory: erpRow.stock_category ?? null,
      });
    }
  }

  const orphansOnWebsite: ErpOrphanOnWebsite[] = [];
  for (const [tag, product] of websiteByTag) {
    const erpRow = erpByTag.get(tag);
    if (erpRow) continue;
    // Not in any uploaded Excel cache — may be jewellery / unexported / sold forever ago
    orphansOnWebsite.push({
      kind: 'orphan_on_website',
      productId: product.id,
      tagNumber: effectiveProductTag(product) || product.tag_number || tag,
      productName: product.name,
      websitePurchasable: isWebsitePurchasable(product),
      category: product.category ?? null,
      productType: product.product_type ?? null,
    });
  }

  const soldOfflineStillLive = stockMismatches.filter((r) => r.websitePurchasable && !r.erpInStock).length;
  const soldOnlineStillInStore = stockMismatches.filter((r) => !r.websitePurchasable && r.erpInStock).length;
  const orphansLive = orphansOnWebsite.filter((r) => r.websitePurchasable).length;

  return {
    syncedAt: meta.syncedAt,
    apiCallsUsed: 0,
    apiCallsRemaining: 0,
    erpTagCount: erpTags.filter((t) => t.erp_stock === 1 && t.stock_category).length,
    websiteTaggedCount: websiteByTag.size,
    matchedInStock,
    missingOnWebsite: missingOnWebsite.sort((a, b) => a.tgno.localeCompare(b.tgno)),
    stockMismatches: stockMismatches.sort((a, b) => a.tgno.localeCompare(b.tgno)),
    orphansOnWebsite: orphansOnWebsite.sort((a, b) => a.tagNumber.localeCompare(b.tagNumber)),
    pendingOutbound: meta.pendingOutbound,
    counts: {
      soldOfflineStillLive,
      soldOnlineStillInStore,
      missingOnWebsite: missingOnWebsite.length,
      orphansLive,
      pendingOutbound: meta.pendingOutbound,
      categoriesUploaded: 0,
      categoriesTotal: STOCK_CATEGORIES.length,
    },
  };
}

function buildCategoryCoverage(
  erpTags: CachedErpTag[],
  missingOnWebsite: ErpMissingOnWebsite[],
  stockMismatches: ErpStockMismatch[],
  matchedLiveByCat: Map<string, number>
): ErpCategoryCoverage[] {
  const byCat = new Map<string, { count: number; lastSyncedAt: string | null }>();
  for (const row of erpTags) {
    if (!row.stock_category) continue;
    const prev = byCat.get(row.stock_category) ?? { count: 0, lastSyncedAt: null };
    if (row.erp_stock === 1) prev.count += 1;
    const synced = row.synced_at ?? null;
    if (synced && (!prev.lastSyncedAt || synced > prev.lastSyncedAt)) prev.lastSyncedAt = synced;
    byCat.set(row.stock_category, prev);
  }

  return STOCK_CATEGORIES.map((cat) => {
    const stats = byCat.get(cat.id);
    return {
      id: cat.id,
      label: cat.label,
      kind: cat.kind,
      uploaded: Boolean(stats?.lastSyncedAt || (stats?.count ?? 0) > 0),
      excelInStock: stats?.count ?? 0,
      matchedLive: matchedLiveByCat.get(cat.id) ?? 0,
      needAdd: missingOnWebsite.filter((r) => r.stockCategory === cat.id).length,
      soldOfflineStillLive: stockMismatches.filter(
        (r) => r.stockCategory === cat.id && r.websitePurchasable && !r.erpInStock
      ).length,
      soldOnlineStillInExcel: stockMismatches.filter(
        (r) => r.stockCategory === cat.id && !r.websitePurchasable && r.erpInStock
      ).length,
      lastSyncedAt: stats?.lastSyncedAt ?? null,
    };
  });
}

async function readSyncMeta(db: ReturnType<typeof asUntypedSupabase>) {
  const { data: state } = await db
    .from<{ last_sync_at: string | null; last_sync_mode: string | null }>('erp_sync_state')
    .select('*')
    .eq('id', 'mmi')
    .maybeSingle();
  const { count: pendingOutbound } = await db
    .from('erp_outbound_queue')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  return {
    syncedAt: state?.last_sync_at ?? null,
    pendingOutbound: pendingOutbound ?? 0,
    lastSyncMode: state?.last_sync_mode === 'excel' ? ('excel' as const) : null,
  };
}

async function loadPendingOutboundTasks(db: ReturnType<typeof asUntypedSupabase>): Promise<ErpOutboundTask[]> {
  const { data: rows } = await db
    .from('erp_outbound_queue')
    .select('id, tag_number, action, status, order_id, product_id, created_at, processed_at, last_error, payload')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100);

  const tasks = (rows ?? []) as ErpOutboundTask[];
  if (!tasks.length) return [];

  const productIds = [...new Set(tasks.map((t) => t.product_id).filter(Boolean))] as string[];
  const orderIds = [...new Set(tasks.map((t) => t.order_id).filter(Boolean))] as string[];

  const [{ data: products }, { data: orders }] = await Promise.all([
    productIds.length
      ? db.from('products').select('id, name').in('id', productIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    orderIds.length
      ? db.from('orders').select('id, order_number').in('id', orderIds)
      : Promise.resolve({ data: [] as Array<{ id: string; order_number: string | null }> }),
  ]);

  const productName = new Map(((products ?? []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name]));
  const orderNumber = new Map(
    ((orders ?? []) as Array<{ id: string; order_number: string | null }>).map((o) => [o.id, o.order_number])
  );

  return tasks.map((t) => ({
    ...t,
    productName: t.product_id ? productName.get(t.product_id) ?? null : null,
    orderNumber: t.order_id ? orderNumber.get(t.order_id) ?? null : null,
  }));
}

async function loadAllRows<T>(
  db: ReturnType<typeof asUntypedSupabase>,
  table: string,
  select: string
): Promise<T[]> {
  const pageSize = 1000;
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db.from(table).select(select).range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const chunk = (data ?? []) as T[];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
  }
  return all;
}

export async function getErpSyncReportFromCache(): Promise<ErpSyncReport> {
  const db = asUntypedSupabase(createAdminClient());
  const meta = await readSyncMeta(db);

  const [erpTags, websiteProducts, pendingOutboundTasks] = await Promise.all([
    loadAllRows<CachedErpTag>(
      db,
      'erp_tag_stock',
      'tgno, tsno, ino, idesc, erp_stock, remarks, tpre, cost_damt, cost_samt, cost_mamt, stock_category, synced_at'
    ),
    loadAllRows<WebsiteTaggedProduct>(
      db,
      'products',
      'id, tag_number, sku, name, in_stock, stock_quantity, availability_status, price_mode, is_active, sold_individually, category, product_type'
    ),
    loadPendingOutboundTasks(db),
  ]);

  // Match Excel TGNO ↔ tag_number or cleaned SKU (legacy rows leave tag_number null)
  const websiteTagged = websiteProducts.filter((p) => {
    const tag = effectiveProductTag(p);
    return Boolean(tag && /^[A-Z]+\d+/i.test(tag));
  });

  const report = buildErpSyncReport(erpTags, websiteTagged, meta);

  // Matched live per Excel sheet (same rule as diffs: SKU or tag_number)
  const websiteByTag = new Map<string, WebsiteTaggedProduct>();
  for (const p of websiteTagged) {
    setWebsiteByTag(websiteByTag, p);
  }
  const matchedLiveByCat = new Map<string, number>();
  for (const row of erpTags) {
    if (row.erp_stock !== 1 || !row.stock_category) continue;
    const web = websiteByTag.get(normalizeTagNumber(row.tgno));
    if (web && isWebsitePurchasable(web)) {
      matchedLiveByCat.set(row.stock_category, (matchedLiveByCat.get(row.stock_category) ?? 0) + 1);
    }
  }

  const categoryCoverage = buildCategoryCoverage(
    erpTags,
    report.missingOnWebsite,
    report.stockMismatches,
    matchedLiveByCat
  );
  const categoriesUploaded = categoryCoverage.filter((c) => c.uploaded).length;

  return {
    ...report,
    pendingOutboundTasks,
    lastSyncMode: meta.lastSyncMode,
    categoryCoverage,
    counts: {
      ...report.counts!,
      categoriesUploaded,
      categoriesTotal: STOCK_CATEGORIES.length,
      pendingOutbound: pendingOutboundTasks.length,
    },
  };
}

/** Wipe Excel cache so the next uploads produce a fresh comparison. */
export async function resetErpExcelCache() {
  const db = asUntypedSupabase(createAdminClient());
  const { error } = await db.from('erp_tag_stock').delete().neq('tgno', '');
  if (error) throw new Error(error.message ?? 'Failed to clear Excel stock cache');

  const now = new Date().toISOString();
  await db.from('erp_sync_state').upsert(
    {
      id: 'mmi',
      last_sync_at: null,
      last_sync_error: null,
      last_sync_mode: null,
      updated_at: now,
    },
    { onConflict: 'id' }
  );

  return getErpSyncReportFromCache();
}

function mapExcelRows(rows: ExcelStockRow[], stockCategory: StockCategoryId) {
  return rows.map((row, index) => ({
    tgno: row.tgno,
    tsno: index + 1,
    ino: null as number | null,
    idesc: row.idesc,
    erp_stock: 1,
    remarks: row.certif,
    tpre: row.stamp,
    cost_damt: null as number | null,
    cost_samt: null as number | null,
    cost_mamt: null as number | null,
    stock_category: stockCategory,
    erp_data: {
      ...row.raw,
      source: row.source,
      stock_category: stockCategory,
      suggestedKind: row.suggestedKind,
      GWT: row.gwt,
      REMARKS: row.certif,
      IDESC: row.idesc,
      subitems: row.design
        ? [{ IDESC: row.design, WT: row.gwt, remarks: row.size }]
        : [],
    },
    synced_at: new Date().toISOString(),
  }));
}

type ErpCacheRow = {
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
  stock_category: string | null;
  erp_data: Record<string, unknown>;
  synced_at: string;
};

const UPSERT_BATCH = 250;

async function batchUpsertErpTags(db: ReturnType<typeof asUntypedSupabase>, rows: ErpCacheRow[]) {
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const batch = rows.slice(i, i + UPSERT_BATCH);
    const { error } = await db.from('erp_tag_stock').upsert(batch, { onConflict: 'tgno' });
    if (error) throw new Error(error.message ?? `Failed to cache ERP tags (batch ${i / UPSERT_BATCH + 1})`);
  }
}

/**
 * Category-scoped Excel sync: updates only tags in `stockCategory`.
 * Tags previously in this category but missing from the upload → sold offline (erp_stock=2).
 * Other categories are left untouched.
 * Legacy API rows (no stock_category) are marked out of stock so they stop polluting diffs.
 */
export async function syncErpTagStockFromExcel(
  files: Array<{ filename: string; buffer: ArrayBuffer | Buffer }>,
  stockCategory: StockCategoryId
) {
  if (!files.length) throw new Error('Upload at least one Excel file');
  if (!getStockCategory(stockCategory)) throw new Error(`Unknown stock category: ${stockCategory}`);

  const parsed = parseMmiStockExcels(files, stockCategory);
  if (!parsed.rows.length) {
    throw new Error('No tag rows found. Check that sheets have a "Tag No" header.');
  }

  const db = asUntypedSupabase(createAdminClient());
  const now = new Date().toISOString();
  const mapped = mapExcelRows(parsed.rows, stockCategory);
  const uploadedTags = new Set(mapped.map((r) => r.tgno));

  // Clear legacy API cache from diffs: anything without a stock_category is no longer "in stock"
  await db
    .from('erp_tag_stock')
    .update({ erp_stock: 2, synced_at: now })
    .is('stock_category', null)
    .eq('erp_stock', 1);

  // Mark previous in-stock tags for this category as sold if missing from upload
  const { data: existing } = await db
    .from('erp_tag_stock')
    .select('tgno, erp_stock')
    .eq('stock_category', stockCategory)
    .eq('erp_stock', 1);

  const soldOffline = ((existing ?? []) as Array<{ tgno: string }>).filter(
    (row) => !uploadedTags.has(normalizeTagNumber(row.tgno))
  );

  for (let i = 0; i < soldOffline.length; i += UPSERT_BATCH) {
    const batch = soldOffline.slice(i, i + UPSERT_BATCH).map((row) => row.tgno);
    const { error } = await db
      .from('erp_tag_stock')
      .update({ erp_stock: 2, synced_at: now })
      .in('tgno', batch)
      .eq('stock_category', stockCategory);
    if (error) throw new Error(error.message ?? 'Failed to mark sold-offline tags');
  }

  await batchUpsertErpTags(db, mapped);

  const { error: stateError } = await db.from('erp_sync_state').upsert({
    id: 'mmi',
    last_sync_at: now,
    last_sync_error: null,
    last_sync_mode: 'excel',
    updated_at: now,
  }, { onConflict: 'id' });

  if (stateError) throw new Error(stateError.message ?? 'Failed to update ERP sync state');

  const report = await getErpSyncReportFromCache();
  const catLabel = getStockCategory(stockCategory)?.label ?? stockCategory;
  const missingForCategory = report.missingOnWebsite.filter((r) => r.stockCategory === stockCategory);
  const soldOfflineLive = report.stockMismatches.filter(
    (r) => r.websitePurchasable && !r.erpInStock && r.stockCategory === stockCategory
  );

  // Notify stock managers once per upload (summary only)
  void notifyStockManagersAfterExcelSync({
    stockCategoryLabel: catLabel,
    soldOfflineStillLive: soldOfflineLive.length,
    missingOnWebsite: missingForCategory.length,
  }).catch((err) => console.error('[erp-sync] stock notify failed', err));

  return {
    report,
    fileStats: parsed.fileStats,
    tagCount: parsed.rows.length,
    stockCategory,
    stockCategoryLabel: catLabel,
    soldOfflineCount: soldOffline.length,
    missingOnWebsiteForCategory: missingForCategory.length,
    soldOfflineStillLive: soldOfflineLive.length,
  };
}

export async function ackErpOutboundTask(
  id: string,
  ack: 'sold' | 'reserved',
  note?: string
) {
  const db = asUntypedSupabase(createAdminClient());
  const now = new Date().toISOString();
  const { data: row } = await db
    .from('erp_outbound_queue')
    .select('id, payload, status, tag_number, order_id')
    .eq('id', id)
    .maybeSingle();

  if (!row) throw new Error('Outbound task not found');
  if (row.status !== 'pending') throw new Error('Task is not pending');

  const payload = {
    ...((row.payload as Record<string, unknown> | null) ?? {}),
    manual_ack: ack,
    manual_ack_note: note ?? null,
    manual_ack_at: now,
  };

  const { error } = await db
    .from('erp_outbound_queue')
    .update({
      status: 'sent',
      payload,
      processed_at: now,
      last_error: null,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  // Clear matching bell notifications so the alert stops after staff confirms MMI update
  const tag = String(row.tag_number ?? '');
  const { data: notifs } = await db
    .from('in_app_notifications')
    .select('id, metadata, entity_id')
    .eq('audience', 'admin')
    .eq('type', 'stock_sold_online')
    .is('read_at', null)
    .limit(100);

  const toRead = ((notifs ?? []) as Array<{ id: string; metadata: unknown; entity_id: string | null }>).filter(
    (n) => {
      const meta = (n.metadata ?? {}) as Record<string, unknown>;
      const metaTag = String(meta.tagNumber ?? '');
      if (tag && metaTag && normalizeTagNumber(metaTag) === normalizeTagNumber(tag)) return true;
      if (row.order_id && n.entity_id === row.order_id) return true;
      return false;
    },
  );

  if (toRead.length) {
    await db
      .from('in_app_notifications')
      .update({ read_at: now })
      .in(
        'id',
        toRead.map((n) => n.id),
      );
  }

  return getErpSyncReportFromCache();
}

/** Find a website product by tag_number or SKU (normalized). */
export async function findWebsiteProductByTag(
  db: ReturnType<typeof asUntypedSupabase>,
  tgno: string
) {
  const key = normalizeTagNumber(tgno);
  if (!key) return null;

  const [{ data: byTag }, { data: bySku }] = await Promise.all([
    db
      .from('products')
      .select('id, name, tag_number, sku, sold_individually, availability_status, price_mode, in_stock, stock_quantity, is_active')
      .ilike('tag_number', key)
      .limit(20),
    db
      .from('products')
      .select('id, name, tag_number, sku, sold_individually, availability_status, price_mode, in_stock, stock_quantity, is_active')
      .ilike('sku', `${key}%`)
      .limit(20),
  ]);

  const rows = [...(byTag ?? []), ...(bySku ?? [])] as (WebsiteTaggedProduct & {
    id: string;
    name: string;
  })[];

  const matches = rows.filter((p) => effectiveProductTag(p) === key);
  if (!matches.length) return null;
  return matches.reduce((best, row) => preferWebsiteProductForTag(best, row));
}

function websiteStatusUpdates(action: WebsiteAvailabilityAction, soldIndividually: boolean, now: string) {
  if (action === 'reserved') {
    return {
      in_stock: false,
      stock_quantity: 0,
      stock_status: 'out_of_stock',
      availability_status: 'reserved',
      updated_at: now,
    };
  }
  return {
    in_stock: false,
    stock_quantity: 0,
    stock_status: 'out_of_stock',
    availability_status: soldIndividually ? 'sold' : 'out_of_stock',
    updated_at: now,
  };
}

/** Mark a website product sold/reserved by tag (offline sale reported manually). */
export async function markWebsiteSoldByTag(tgno: string, action: WebsiteAvailabilityAction = 'sold') {
  const key = normalizeTagNumber(tgno);
  if (!key) throw new Error('Invalid tag number');

  const db = asUntypedSupabase(createAdminClient());
  const product = await findWebsiteProductByTag(db, tgno);

  if (!product) {
    return { updated: 0, product: null, report: await getErpSyncReportFromCache() };
  }

  const now = new Date().toISOString();
  const { error } = await db
    .from('products')
    .update(websiteStatusUpdates(action, Boolean(product.sold_individually), now))
    .eq('id', product.id);

  if (error) throw new Error(error.message);

  // Keep cache in sync when confirming offline sale: tag no longer in offline stock
  if (action === 'sold') {
    await db.from('erp_tag_stock').upsert(
      {
        tgno: key,
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
        erp_data: { source: 'manual_offline_sold', TGNO: key },
        synced_at: now,
      },
      { onConflict: 'tgno' }
    );
  }

  return {
    updated: 1,
    product: { id: product.id, name: product.name, tag_number: product.tag_number ?? key },
    report: await getErpSyncReportFromCache(),
  };
}

export async function applyErpStockToWebsite(
  productIds?: string[],
  action: WebsiteAvailabilityAction = 'sold'
) {
  const db = asUntypedSupabase(createAdminClient());
  const now = new Date().toISOString();
  let ids = productIds ?? [];

  // No ids passed → mark every “sold offline, still live” mismatch
  if (!ids.length) {
    const report = await getErpSyncReportFromCache();
    ids = report.stockMismatches
      .filter((row) => !row.erpInStock && row.websitePurchasable)
      .map((row) => row.productId);
  }

  let updated = 0;
  for (const productId of ids) {
    const { data: product } = await db
      .from<{ sold_individually: boolean | null }>('products')
      .select('id, sold_individually')
      .eq('id', productId)
      .maybeSingle();
    if (!product) continue;

    const updates = websiteStatusUpdates(action, Boolean(product.sold_individually), now);
    const { error } = await db.from('products').update(updates).eq('id', productId);
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

  void notifyStockManagers({
    type: 'stock_sold_online',
    title: 'Sold on website — update MMI',
    message: `Tag ${tag} was sold online. Update offline software, then confirm reserved or sold on the stock dashboard.`,
    href: '/admin/stock',
    entityId: input.orderId ?? tag,
    metadata: { tagNumber: tag, productId: input.productId ?? null },
  }).catch((err) => console.error('[erp-sync] sold-online notify failed', err));
}

export async function findCachedErpTag(db: ReturnType<typeof asUntypedSupabase>, tgno: string) {
  const key = normalizeTagNumber(tgno);
  if (!key) return null;

  const { data: rows } = await db
    .from('erp_tag_stock')
    .select('tgno, tsno, ino, idesc, erp_stock, remarks, tpre, cost_damt, cost_samt, cost_mamt, erp_data, synced_at')
    .ilike('tgno', tgno.trim());

  return ((rows ?? []) as (CachedErpTag & { erp_data?: Record<string, unknown> | null; synced_at?: string | null })[]).find(
    (row) => normalizeTagNumber(row.tgno) === key
  ) ?? null;
}

export async function getErpTagDetail(tgno: string): Promise<ErpTagDetail | null> {
  const key = normalizeTagNumber(tgno);
  if (!key) return null;

  const db = asUntypedSupabase(createAdminClient());
  const erpRow = await findCachedErpTag(db, tgno);
  const websiteProduct = await findWebsiteProductByTag(db, tgno);

  const website: ErpTagDetailWebsite | null = websiteProduct
    ? {
        id: websiteProduct.id,
        name: websiteProduct.name,
        slug: null,
        tag_number: websiteProduct.tag_number,
        price: null,
        in_stock: websiteProduct.in_stock,
        availability_status: websiteProduct.availability_status,
        is_active: websiteProduct.is_active,
        stock_quantity: websiteProduct.stock_quantity,
      }
    : null;

  const raw = (erpRow as { erp_data?: Record<string, unknown> } | null)?.erp_data ?? {};
  const subitems = Array.isArray(raw.subitems) ? (raw.subitems as Array<Record<string, unknown>>) : [];

  const websitePurchasable = websiteProduct ? isWebsitePurchasable(websiteProduct) : false;

  const base: ErpTagDetail = {
    tgno: erpRow?.tgno ?? tgno.trim(),
    foundInCache: Boolean(erpRow),
    erp: erpRow
      ? {
          tsno: erpRow.tsno,
          ino: erpRow.ino,
          idesc: erpRow.idesc,
          remarks: erpRow.remarks,
          tpre: erpRow.tpre,
          erp_stock: erpRow.erp_stock,
          cost_damt: erpRow.cost_damt,
          cost_samt: erpRow.cost_samt,
          cost_mamt: erpRow.cost_mamt,
          estimatedPrice:
            Number(erpRow.cost_damt ?? 0) + Number(erpRow.cost_samt ?? 0) + Number(erpRow.cost_mamt ?? 0),
          synced_at: (erpRow as { synced_at?: string | null }).synced_at ?? null,
          tdate: raw.TDATE != null ? String(raw.TDATE) : raw.tdate != null ? String(raw.tdate) : null,
          gwt: raw.GWT != null ? Number(raw.GWT) : raw.gwt != null ? Number(raw.gwt) : null,
          tag_fine1: raw.TAGFINE1 != null ? Number(raw.TAGFINE1) : null,
          tag_fine2: raw.TAGFINE2 != null ? Number(raw.TAGFINE2) : null,
          subitems,
          raw,
        }
      : null,
    website,
    status: {
      erpInStock: erpRow?.erp_stock === 1,
      websitePurchasable,
      onWebsite: Boolean(website),
      inErpCache: Boolean(erpRow),
    },
  };

  return enrichErpTagDetail(base);
}

export function slugifyForProduct(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180) || 'erp-item';
}

export function buildDraftProductFromErpTag(row: CachedErpTag & { erp_data?: Record<string, unknown> }, kind: FormKind = 'jewellery') {
  const cfg = KIND_CONFIGS[kind];
  const raw = row.erp_data ?? {};
  const baseSlug = slugifyForProduct(`${row.idesc ?? 'item'}-${row.tgno}`);
  const costPrice = estimateErpTagPrice({
    COSTDAMT: row.cost_damt ?? undefined,
    COSTSAMT: row.cost_samt ?? undefined,
    COSTMAMT: row.cost_mamt ?? undefined,
  });
  const prefill = buildPrefillFromErpRow(
    {
      tgno: row.tgno,
      idesc: row.idesc,
      remarks: row.remarks,
      gwt: raw.GWT != null ? Number(raw.GWT) : raw.gwt != null ? Number(raw.gwt) : null,
      estimatedPrice: costPrice,
      raw,
    },
    kind
  );

  return {
    sku: `ERP-${row.tgno}`.slice(0, 50),
    name: prefill.name,
    slug: baseSlug,
    category: cfg.category,
    product_type: cfg.productType,
    tag_number: row.tgno,
    price: prefill.price,
    certificate_number: prefill.certificate_number,
    short_desc: prefill.short_desc,
    metal_weight_grams: prefill.metal_weight_grams,
    in_stock: row.erp_stock === 1,
    stock_quantity: row.erp_stock === 1 ? 1 : 0,
    stock_status: row.erp_stock === 1 ? 'in_stock' : 'out_of_stock',
    availability_status: row.erp_stock === 1 ? 'in_stock' : 'out_of_stock',
    sold_individually: true,
    is_active: false,
    legacy_data: { erp: row, erp_kind: kind },
  };
}

// ponytail: runnable self-check — `npx tsx -e "import { __erpSyncSelfCheck } from './src/lib/erp/sync.ts'; __erpSyncSelfCheck()"`
export function __erpSyncSelfCheck() {
  const erpTags: CachedErpTag[] = [
    { tgno: 'DK1', tsno: 1, ino: 10, idesc: 'Diamond Bangle', erp_stock: 1, remarks: null, tpre: null, cost_damt: 1000, cost_samt: 0, cost_mamt: 0, stock_category: 'diamond' },
    { tgno: 'DK2', tsno: 2, ino: 11, idesc: 'Sold Ring', erp_stock: 2, remarks: null, tpre: null, cost_damt: 0, cost_samt: 0, cost_mamt: 0, stock_category: 'diamond' },
    { tgno: 'A003', tsno: 1, ino: 1, idesc: 'STN. 20.5 RATTI', erp_stock: 1, remarks: null, tpre: null, cost_damt: 0, cost_samt: 0, cost_mamt: 0, stock_category: 'semi_pre' },
    { tgno: 'A306', tsno: 1, ino: 2, idesc: 'On demand', erp_stock: 1, remarks: null, tpre: null, cost_damt: 0, cost_samt: 0, cost_mamt: 0, stock_category: 'semi_pre' },
  ];
  const website: WebsiteTaggedProduct[] = [
    // Inactive ERP draft must lose to live SKU for same tag
    {
      id: 'draft',
      tag_number: 'A003',
      sku: 'ERP-A003',
      name: 'STONES',
      in_stock: true,
      stock_quantity: 1,
      availability_status: 'in_stock',
      is_active: false,
      sold_individually: true,
    },
    {
      id: 'live',
      tag_number: null,
      sku: 'A003.',
      name: 'MALACHITE 18.63ct',
      in_stock: true,
      stock_quantity: 1,
      availability_status: 'in_stock',
      is_active: true,
      sold_individually: false,
    },
    {
      id: 'ondemand',
      tag_number: 'A306',
      sku: 'A306',
      name: 'On demand stone',
      in_stock: false,
      stock_quantity: 0,
      availability_status: 'on_demand',
      is_active: true,
      sold_individually: true,
    },
    { id: 'p1', tag_number: 'dk1', name: 'Bangle', in_stock: true, stock_quantity: 1, availability_status: 'in_stock', is_active: true, sold_individually: true },
    { id: 'p2', tag_number: 'WEB-ONLY', name: 'Website only', in_stock: true, stock_quantity: 1, availability_status: 'in_stock', is_active: true, sold_individually: true },
  ];
  const report = buildErpSyncReport(erpTags, website, { syncedAt: null, apiCallsUsed: 2, pendingOutbound: 0 });
  console.assert(report.missingOnWebsite.length === 0, 'DK1 is on website');
  console.assert(report.stockMismatches.some((row) => row.tgno === 'DK2') === false, 'DK2 not on website yet');
  console.assert(report.orphansOnWebsite.length === 1, 'WEB-ONLY is orphan');
  const a003 = report.stockMismatches.find((row) => normalizeTagNumber(row.tgno) === 'A003');
  console.assert(!a003, 'A003 live product should not look sold-online vs Excel');
  console.assert(
    !report.stockMismatches.some((row) => normalizeTagNumber(row.tgno) === 'A306'),
    'A306 on-demand must not appear as sold-online',
  );
  console.assert(
    report.matchedInStock >= 2,
    'A003 + DK1 should count as matched in stock',
  );
}
