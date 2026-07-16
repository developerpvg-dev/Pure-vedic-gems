'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Loader2, PlusCircle, Store } from 'lucide-react';
import type { FormKind } from '@/components/admin/product-form/kinds';
import { KIND_CONFIGS, KIND_ORDER } from '@/components/admin/product-form/kinds';
import { buildPrefillFromErpRow, buildProductFormUrl, suggestErpProductKind } from '@/lib/erp/erp-prefill';

type ErpAddProductActionsProps = {
  tgno: string;
  name: string;
  remarks?: string | null;
  estimatedPrice?: number;
  retailRate?: number | null;
  gwt?: number | null;
  suggestedKind?: FormKind;
  creatingDraft?: boolean;
  onCreateDraft?: (tgno: string, kind: FormKind) => void;
  compact?: boolean;
};

export function ErpAddProductActions({
  tgno,
  name,
  remarks = null,
  estimatedPrice = 0,
  retailRate,
  gwt,
  suggestedKind,
  creatingDraft = false,
  onCreateDraft,
  compact = false,
}: ErpAddProductActionsProps) {
  const defaultKind = suggestedKind ?? suggestErpProductKind(name);
  const [kind, setKind] = useState<FormKind>(defaultKind);

  const addUrl = useMemo(() => {
    const prefill = buildPrefillFromErpRow(
      { tgno, idesc: name, remarks, gwt, estimatedPrice, retailRate },
      kind
    );
    return buildProductFormUrl(prefill);
  }, [tgno, name, remarks, gwt, estimatedPrice, retailRate, kind]);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'sm:justify-end'}`}>
      <label className="sr-only" htmlFor={`erp-kind-${tgno}`}>
        Product category for {tgno}
      </label>
      <select
        id={`erp-kind-${tgno}`}
        value={kind}
        onChange={(e) => setKind(e.target.value as FormKind)}
        className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800"
        title="Choose product category"
      >
        {KIND_ORDER.map((k) => (
          <option key={k} value={k}>
            {KIND_CONFIGS[k].shortLabel}
            {defaultKind === k ? ' ★' : ''}
          </option>
        ))}
      </select>

      <Link
        href={addUrl}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <PlusCircle className="h-4 w-4" /> Add manually
      </Link>

      {onCreateDraft ? (
        <button
          type="button"
          onClick={() => onCreateDraft(tgno, kind)}
          disabled={creatingDraft}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {creatingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
          Create draft
        </button>
      ) : null}
    </div>
  );
}
