/** Shared ERP helpers (no MMI API). */

/** Normalize tag / messy SKU → comparable key (strips trailing dots, takes TAG+digits). */
export function normalizeTagNumber(value: string | null | undefined) {
  const cleaned = (value ?? '').trim().toUpperCase().replace(/\.+$/, '').replace(/\s+/g, '');
  if (!cleaned) return '';
  // ponytail: SKUs are often "Q419.." — take leading letter+digit tag form when present
  const m = cleaned.match(/^([A-Z]+\d+[A-Z0-9]*)/);
  return m ? m[1] : cleaned;
}

/** Prefer tag_number; fall back to SKU (legacy catalog rarely fills tag_number). */
export function effectiveProductTag(product: {
  tag_number?: string | null;
  sku?: string | null;
}) {
  return normalizeTagNumber(product.tag_number) || normalizeTagNumber(product.sku);
}

export function estimateErpTagPrice(row: {
  COSTDAMT?: number | null;
  COSTSAMT?: number | null;
  COSTMAMT?: number | null;
  cost_damt?: number | null;
  cost_samt?: number | null;
  cost_mamt?: number | null;
}) {
  return (
    Number(row.COSTDAMT ?? row.cost_damt ?? 0) +
    Number(row.COSTSAMT ?? row.cost_samt ?? 0) +
    Number(row.COSTMAMT ?? row.cost_mamt ?? 0)
  );
}
