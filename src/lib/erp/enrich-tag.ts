import { buildPrefillFromErpRow, suggestErpProductKind } from '@/lib/erp/erp-prefill';
import type { ErpTagDetail, ErpTagDetailEnrichment } from '@/lib/erp/types';

export { suggestErpProductKind, buildPrefillFromErpRow, buildProductFormUrl } from '@/lib/erp/erp-prefill';

/** Enrich from cached Excel/ERP row only (no live MMI API). */
export async function enrichErpTagDetail(base: ErpTagDetail): Promise<ErpTagDetail> {
  const erp = base.erp;
  const raw = erp?.raw ?? {};
  const stockCategory = raw.stock_category != null ? String(raw.stock_category) : null;

  const enrichment: ErpTagDetailEnrichment = {
    itemGroupName: stockCategory,
    itemMasterName: erp?.tpre ?? null,
    designCode: null,
    designPhoto: null,
    retailRate: null,
    laborCharge: null,
    liveFetched: false,
  };

  const suggestedKind =
    (raw.suggestedKind as import('@/components/admin/product-form/kinds').FormKind | undefined) ??
    suggestErpProductKind(erp?.idesc ?? null, enrichment.itemGroupName);

  const prefill = erp
    ? buildPrefillFromErpRow(
        {
          tgno: base.tgno,
          idesc: erp.idesc,
          remarks: erp.remarks,
          gwt: erp.gwt,
          estimatedPrice: erp.estimatedPrice,
          raw: erp.raw,
        },
        suggestedKind
      )
    : null;

  return {
    ...base,
    enrichment,
    suggestedKind,
    prefill,
  };
}
