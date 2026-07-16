import * as XLSX from 'xlsx';
import type { FormKind } from '@/components/admin/product-form/kinds';
import { normalizeTagNumber } from '@/lib/erp/erp-utils';
import {
  getStockCategory,
  suggestStockCategoryFromFilename,
  type StockCategoryId,
} from '@/lib/erp/stock-categories';

export type ExcelStockRow = {
  tgno: string;
  idesc: string;
  stamp: string | null;
  gwt: number | null;
  design: string | null;
  certif: string | null;
  size: string | null;
  source: string;
  stockCategory: StockCategoryId;
  suggestedKind: FormKind;
  raw: Record<string, unknown>;
};

function cellStr(value: unknown) {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function cellNum(value: unknown) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function headerMap(headerRow: unknown[]) {
  const map = new Map<string, number>();
  headerRow.forEach((cell, i) => {
    const key = String(cell ?? '').trim().toLowerCase();
    if (key) map.set(key, i);
  });
  return map;
}

function col(map: Map<string, number>, row: unknown[], ...names: string[]) {
  for (const name of names) {
    const idx = map.get(name);
    if (idx != null) return row[idx];
  }
  return null;
}

/** Parse one MMI Tag Stock Excel export for a chosen stock category. */
export function parseMmiStockExcel(
  buffer: ArrayBuffer | Buffer,
  filename: string,
  stockCategory: StockCategoryId
): ExcelStockRow[] {
  const cat = getStockCategory(stockCategory);
  if (!cat) throw new Error(`Unknown stock category: ${stockCategory}`);

  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
  const headerIdx = rows.findIndex(
    (r) => Array.isArray(r) && String(r[0] ?? '').trim().toLowerCase() === 'tag no'
  );
  if (headerIdx < 0) {
    throw new Error(`${filename}: could not find "Tag No" header row`);
  }

  const map = headerMap(rows[headerIdx] as unknown[]);
  const source = filename.replace(/\.xlsx?$/i, '').trim() || filename;
  const out: ExcelStockRow[] = [];
  const seen = new Set<string>();

  for (const row of rows.slice(headerIdx + 1)) {
    if (!Array.isArray(row) || row[0] == null || row[0] === '') continue;
    const tgno = normalizeTagNumber(String(row[0]));
    // MMI tags always have a letter prefix (A704, DK1). Reject pure numbers / totals.
    if (!tgno || !/^[A-Z]+\d+[A-Z0-9]*$/i.test(tgno)) continue;
    if (seen.has(tgno)) continue;
    seen.add(tgno);

    const itemName = cellStr(col(map, row, 'item name'));
    const stamp = cellStr(col(map, row, 'stamp'));
    const gwt = cellNum(col(map, row, 'gr.wt', 'gwt', 'wt'));
    const design = cellStr(col(map, row, 'design'));
    const certif = cellStr(col(map, row, 'certif', 'cert', 'certificate'));
    const size = cellStr(col(map, row, 'size'));

    const idesc =
      [stamp && stamp !== itemName ? stamp : null, design, size]
        .filter(Boolean)
        .join(' · ') ||
      itemName ||
      stamp ||
      tgno;

    out.push({
      tgno,
      idesc,
      stamp,
      gwt,
      design,
      certif,
      size,
      source,
      stockCategory,
      suggestedKind: cat.kind,
      raw: {
        source,
        filename,
        stock_category: stockCategory,
        suggestedKind: cat.kind,
        stamp,
        gwt,
        design,
        certif,
        size,
        'Item Name': itemName,
        GWT: gwt,
        REMARKS: certif,
      },
    });
  }

  return out;
}

export function parseMmiStockExcels(
  files: Array<{ filename: string; buffer: ArrayBuffer | Buffer }>,
  stockCategory: StockCategoryId
) {
  const byTag = new Map<string, ExcelStockRow>();
  const fileStats: Array<{ filename: string; count: number; stockCategory: StockCategoryId }> = [];

  for (const file of files) {
    const rows = parseMmiStockExcel(file.buffer, file.filename, stockCategory);
    fileStats.push({ filename: file.filename, count: rows.length, stockCategory });
    for (const row of rows) byTag.set(row.tgno, row);
  }

  return { rows: [...byTag.values()], fileStats };
}

export { suggestStockCategoryFromFilename };
