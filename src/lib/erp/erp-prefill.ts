import type { FormKind } from '@/components/admin/product-form/kinds';
import { KIND_CONFIGS } from '@/components/admin/product-form/kinds';
import type { ErpTagDetailPrefill } from '@/lib/erp/types';

export function suggestErpProductKind(idesc: string | null, groupName?: string | null): FormKind {
  const text = `${idesc ?? ''} ${groupName ?? ''}`.toLowerCase();
  if (/rudraksha|mukhi|mala/.test(text)) return 'rudraksha';
  if (/idol|murti|shivling|yantra|ganesh|lakshmi|shiva|durga|sai/.test(text)) return 'idol';
  if (/ring|bangle|pendant|bracelet|necklace|earring|jewel|jewellery|jewelry|bridal|chain|kada/.test(text)) {
    return 'jewellery';
  }
  if (/ruby|sapphire|emerald|diamond|coral|pearl|hessonite|cat.?s?.eye|navratna|pukhraj|neelam|manik|panna|moonga|gomed|lehsunia|yellow\s*sapp/.test(text)) {
    return 'navratna';
  }
  if (/opal|amethyst|garnet|topaz|tourmaline|stone|tanzanite|citrine|aquamarine/.test(text)) return 'upratna';
  return 'jewellery';
}

export function buildPrefillFromErpRow(
  row: {
    tgno: string;
    idesc: string | null;
    remarks: string | null;
    gwt?: number | null;
    estimatedPrice: number;
    retailRate?: number | null;
    raw?: Record<string, unknown>;
  },
  kind: FormKind
): ErpTagDetailPrefill {
  const price = row.retailRate && row.retailRate > 0 ? row.retailRate : row.estimatedPrice;
  const raw = row.raw ?? {};
  const subitems = Array.isArray(raw.subitems) ? raw.subitems : [];
  const subSummary = subitems
    .map((s: Record<string, unknown>) => `${s.IDESC ?? s.idesc ?? 'Item'}${s.WT != null ? ` ${s.WT}g` : ''}`)
    .join(' · ');

  const cfg = KIND_CONFIGS[kind];
  return {
    kind,
    name: row.idesc ?? `ERP ${row.tgno}`,
    tag_number: row.tgno,
    price: Math.max(0, Math.round(price)),
    certificate_number: row.remarks?.trim() || undefined,
    metal_weight_grams: row.gwt != null && row.gwt > 0 ? row.gwt : undefined,
    short_desc: subSummary || row.remarks?.trim() || undefined,
    category: cfg.category,
    product_type: cfg.productType,
  };
}

export function buildProductFormUrl(prefill: ErpTagDetailPrefill) {
  const params = new URLSearchParams();
  params.set('tag_number', prefill.tag_number);
  params.set('name', prefill.name);
  if (prefill.price > 0) params.set('price', String(prefill.price));
  if (prefill.certificate_number) params.set('certificate_number', prefill.certificate_number);
  if (prefill.metal_weight_grams) params.set('metal_weight_grams', String(prefill.metal_weight_grams));
  if (prefill.short_desc) params.set('short_desc', prefill.short_desc);
  if (prefill.sub_category) params.set('sub_category', prefill.sub_category);
  return `/admin/products/new/${prefill.kind}?${params.toString()}`;
}
