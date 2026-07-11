import type { ErpItemMasterGroup, ErpStockFilter, ErpTagStockRow } from '@/lib/erp/types';

const DEFAULT_BASE_URL = 'https://proapi.mmierp.com';
const ERP_FETCH_TIMEOUT_MS = Number(process.env.MMI_ERP_FETCH_TIMEOUT_MS ?? 60_000);

/** Confirmed working request: groupby must be empty string for per-tag TGNO rows. */
export const ERP_TAG_STOCK_REQUEST = {
  stock: 1,
  tsno: 0,
  maxtsno: 0,
  ino: 0,
  stampid: 0,
  catid: 0,
  orderby: 'tsno',
  groupby: '',
} as const;

type ErpApiResponse<T> = {
  status: number;
  result: T;
};

function getErpConfig() {
  const token = process.env.MMI_ERP_API_TOKEN?.trim();
  const baseUrl = (process.env.MMI_ERP_API_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, '');
  return { token, baseUrl };
}

export function isErpConfigured() {
  return Boolean(getErpConfig().token);
}

async function erpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { token, baseUrl } = getErpConfig();
  if (!token) throw new Error('MMI_ERP_API_TOKEN is not configured');

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'X-API-TOKEN': token,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(ERP_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`ERP API ${path} failed (HTTP ${response.status})`);
  }

  const payload = (await response.json()) as ErpApiResponse<T> & { result?: unknown };
  if (payload.status !== 1) {
    const detail = typeof payload.result === 'string' ? payload.result : JSON.stringify(payload.result ?? '');
    throw new Error(`ERP API ${path} error: ${detail || `status ${payload.status}`}`);
  }

  return payload.result;
}

/** Grouped shape when groupby=ino — not usable for per-tag sync. */
type ErpGroupedTagRow = {
  tsno?: string | number;
  inos?: Array<{ ino?: string | number; item_name?: string }>;
};

function readTagField(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function readNumber(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value != null && value !== '') {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

/** Flatten API result to per-tag rows. Requires groupby="" (Postman-confirmed). */
export function normalizeTagStockResult(raw: unknown): ErpTagStockRow[] {
  if (!Array.isArray(raw)) return [];

  const flat: ErpTagStockRow[] = [];
  for (const entry of raw) {
    const row = entry as Record<string, unknown>;
    const tgno = readTagField(row, 'TGNO', 'tgno');
    if (tgno) {
      flat.push({
        tsno: Number(row.tsno ?? row.TSNO ?? 0),
        TGNO: tgno,
        INO: Number(row.INO ?? row.ino ?? 0),
        IDESC: readTagField(row, 'IDESC', 'idesc', 'item_name') || tgno,
        TPRE: readTagField(row, 'TPRE', 'tpre') || undefined,
        REMARKS: readTagField(row, 'REMARKS', 'remarks') || undefined,
        TDATE: readTagField(row, 'TDATE', 'tdate') || undefined,
        GWT: readNumber(row, 'GWT', 'gwt'),
        COSTDAMT: readNumber(row, 'COSTDAMT', 'costdamt'),
        COSTSAMT: readNumber(row, 'COSTSAMT', 'costsamt'),
        COSTMAMT: readNumber(row, 'COSTMAMT', 'costmamt'),
        raw: row,
      });
      continue;
    }

    const grouped = entry as ErpGroupedTagRow;
    if (grouped.inos?.length) continue;
  }

  return flat;
}

export async function fetchTagStock(options?: {
  stock?: ErpStockFilter;
  maxtsno?: number;
  ino?: number;
}) {
  const raw = await erpFetch<unknown>('/api/tp/tgstst', {
    method: 'POST',
    body: JSON.stringify({
      ...ERP_TAG_STOCK_REQUEST,
      stock: options?.stock ?? ERP_TAG_STOCK_REQUEST.stock,
      maxtsno: options?.maxtsno ?? 0,
      ino: options?.ino ?? 0,
    }),
  });

  const tags = normalizeTagStockResult(raw);
  if (Array.isArray(raw) && raw.length > 0 && tags.length === 0) {
    throw new Error(
      'ERP returned grouped item data without TGNO. Use groupby: "" in the request (not "ino").'
    );
  }

  return tags;
}

export async function fetchItemMaster() {
  return erpFetch<ErpItemMasterGroup[]>('/api/tp/getitm', { method: 'GET' });
}

export function normalizeTagNumber(value: string | null | undefined) {
  return (value ?? '').trim().toUpperCase();
}

export function estimateErpTagPrice(row: Pick<ErpTagStockRow, 'COSTDAMT' | 'COSTSAMT' | 'COSTMAMT'>) {
  return Number(row.COSTDAMT ?? 0) + Number(row.COSTSAMT ?? 0) + Number(row.COSTMAMT ?? 0);
}
