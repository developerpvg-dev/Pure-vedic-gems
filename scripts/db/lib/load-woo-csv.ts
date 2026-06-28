import { readFileSync } from 'node:fs';
import { parseCsvContent } from './parse-csv-line';

export type WooProductRow = {
  legacy_woo_id: number;
  type: string;
  parent_id: number | null;
  certificate_values: string | null;
  energization_values: string | null;
  display_certificate_option: string | null;
};

function normalizeCsvHeader(value: string): string {
  return value.replace(/^\uFEFF/, '').trim();
}

function readAttribute(
  cols: string[],
  attrNameIndexes: number[],
  attrValueIndexes: number[],
  matchers: RegExp
): string | null {
  for (let attr = 0; attr < attrNameIndexes.length; attr += 1) {
    const nameIdx = attrNameIndexes[attr];
    const valueIdx = attrValueIndexes[attr];
    if (nameIdx < 0 || valueIdx < 0) continue;
    const attrName = (cols[nameIdx] ?? '').trim().toLowerCase();
    if (matchers.test(attrName)) {
      return cols[valueIdx] ?? null;
    }
  }
  return null;
}

export function loadWooProductCsv(path: string): Map<number, WooProductRow> {
  const raw = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  const records = parseCsvContent(raw);
  if (records.length < 2) return new Map();

  const header = records[0].map(normalizeCsvHeader);
  const indexOf = (name: string) => header.indexOf(name);
  const attrNameIndexes = [1, 2, 3, 4, 5, 6, 7].map((n) => indexOf(`Attribute ${n} name`));
  const attrValueIndexes = [1, 2, 3, 4, 5, 6, 7].map((n) => indexOf(`Attribute ${n} value(s)`));

  const byId = new Map<number, WooProductRow>();

  for (let lineIndex = 1; lineIndex < records.length; lineIndex += 1) {
    const cols = records[lineIndex];
    const legacy_woo_id = Number(cols[indexOf('ID')]);
    if (!Number.isFinite(legacy_woo_id)) continue;

    const certificate_values = readAttribute(
      cols,
      attrNameIndexes,
      attrValueIndexes,
      /^(certificate|pa_certificate)$/
    );
    const energization_values = readAttribute(
      cols,
      attrNameIndexes,
      attrValueIndexes,
      /(pooja|energiz)/
    );

    const parentRaw = cols[indexOf('Parent')]?.trim();
    const parent_id = parentRaw ? Number(parentRaw) : null;

    byId.set(legacy_woo_id, {
      legacy_woo_id,
      type: (cols[indexOf('Type')] ?? '').trim().toLowerCase(),
      parent_id: Number.isFinite(parent_id) ? parent_id : null,
      certificate_values,
      energization_values,
      display_certificate_option: cols[indexOf('Meta: display_certificate_option')]?.trim() || null,
    });
  }

  return byId;
}

export function resolveWooParentValue(
  row: WooProductRow | undefined,
  wooById: Map<number, WooProductRow>,
  field: 'certificate_values' | 'energization_values'
): string | null {
  if (!row) return null;
  if (row[field]) return row[field];
  if (row.parent_id) {
    const parent = wooById.get(row.parent_id);
    if (parent?.[field]) return parent[field];
  }
  return null;
}
