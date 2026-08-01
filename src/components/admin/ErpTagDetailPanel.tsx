'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ExternalLink, Loader2, Tag, X } from 'lucide-react';
import type { FormKind } from '@/components/admin/product-form/kinds';
import { ErpAddProductActions } from '@/components/admin/ErpAddProductActions';
import { buildPrefillFromErpRow } from '@/lib/erp/erp-prefill';
import type { ErpTagDetail } from '@/lib/erp/types';

type ErpTagDetailPanelProps = {
  detail: ErpTagDetail | null;
  loading: boolean;
  error: string;
  creatingDraft: boolean;
  onClose: () => void;
  onCreateDraft: (tgno: string, kind: FormKind) => void;
};

export function ErpTagDetailPanel({
  detail,
  loading,
  error,
  creatingDraft,
  onClose,
  onCreateDraft,
}: ErpTagDetailPanelProps) {
  const prefillPreview = useMemo(() => {
    if (!detail?.erp) return null;
    return buildPrefillFromErpRow(
      {
        tgno: detail.tgno,
        idesc: detail.erp.idesc,
        remarks: detail.erp.remarks,
        gwt: detail.erp.gwt,
        estimatedPrice: detail.erp.estimatedPrice,
        retailRate: detail.enrichment?.retailRate,
        raw: detail.erp.raw,
      },
      detail.suggestedKind ?? 'jewellery'
    );
  }, [detail]);

  if (!loading && !detail && !error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="erp-tag-detail-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-amber-600" />
            <h2 id="erp-tag-detail-title" className="text-lg font-semibold text-gray-900">
              Tag details
              {detail ? (
                <span className="ml-2 font-mono text-base text-amber-700">{detail.tgno}</span>
              ) : null}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading tag…
            </div>
          )}

          {error && !loading && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
          )}

          {detail && !loading && (
            <>
              <div className="flex flex-wrap gap-2">
                <StatusPill
                  label={detail.status.erpInStock ? 'ERP in stock' : 'ERP not in stock'}
                  tone={detail.status.erpInStock ? 'green' : 'gray'}
                />
                <StatusPill
                  label={detail.status.onWebsite ? 'On website' : 'Not on website'}
                  tone={detail.status.onWebsite ? 'blue' : 'gray'}
                />
                {detail.status.onWebsite && (
                  <StatusPill
                    label={detail.status.websitePurchasable ? 'Website purchasable' : 'Website not purchasable'}
                    tone={detail.status.websitePurchasable ? 'green' : 'amber'}
                  />
                )}
                {detail.enrichment?.liveFetched && (
                  <StatusPill label="Live from ERP" tone="blue" />
                )}
              </div>

              {detail.erp ? (
                <section>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">ERP (offline store)</h3>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <DetailRow label="Item name" value={detail.erp.idesc} />
                    <DetailRow label="Item no (INO)" value={detail.erp.ino != null ? String(detail.erp.ino) : null} />
                    <DetailRow label="TSNO" value={String(detail.erp.tsno)} />
                    <DetailRow label="Prefix (TPRE)" value={detail.erp.tpre} />
                    <DetailRow label="Remarks / cert" value={detail.erp.remarks} />
                    <DetailRow label="Tag date" value={detail.erp.tdate} />
                    <DetailRow label="Gross weight" value={detail.erp.gwt != null ? `${detail.erp.gwt} g` : null} />
                    <DetailRow
                      label="Fine weight"
                      value={
                        detail.erp.tag_fine1 || detail.erp.tag_fine2
                          ? `${detail.erp.tag_fine1 ?? '—'} / ${detail.erp.tag_fine2 ?? '—'}`
                          : null
                      }
                    />
                    <DetailRow
                      label="Retail rate (design)"
                      value={
                        detail.enrichment?.retailRate
                          ? `₹${detail.enrichment.retailRate.toLocaleString('en-IN')}`
                          : null
                      }
                    />
                    <DetailRow
                      label="Cost total"
                      value={detail.erp.estimatedPrice > 0 ? `₹${detail.erp.estimatedPrice.toLocaleString('en-IN')}` : null}
                    />
                    <DetailRow
                      label="Cost breakdown"
                      value={
                        detail.erp.cost_damt || detail.erp.cost_samt || detail.erp.cost_mamt
                          ? `D ₹${detail.erp.cost_damt ?? 0} · S ₹${detail.erp.cost_samt ?? 0} · M ₹${detail.erp.cost_mamt ?? 0}`
                          : null
                      }
                    />
                    <DetailRow
                      label="Item group"
                      value={detail.enrichment?.itemGroupName}
                    />
                    <DetailRow
                      label="Item master"
                      value={detail.enrichment?.itemMasterName}
                    />
                    <DetailRow
                      label="Design code"
                      value={detail.enrichment?.designCode}
                    />
                    <DetailRow
                      label="Labor charge"
                      value={
                        detail.enrichment?.laborCharge
                          ? `₹${detail.enrichment.laborCharge.toLocaleString('en-IN')}`
                          : null
                      }
                    />
                    <DetailRow
                      label="Last synced"
                      value={detail.erp.synced_at ? new Date(detail.erp.synced_at).toLocaleString() : null}
                    />
                  </dl>

                  {detail.enrichment?.designPhoto ? (
                    <p className="mt-3 text-sm text-gray-600">
                      Design photo: <span className="font-mono text-xs">{detail.enrichment.designPhoto}</span>
                    </p>
                  ) : null}

                  {detail.erp.subitems.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Sub-items</p>
                      <div className="space-y-2">
                        {detail.erp.subitems.map((sub, i) => (
                          <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                            <p className="font-medium text-gray-900">{String(sub.IDESC ?? sub.idesc ?? 'Item')}</p>
                            <p className="text-gray-500">
                              {sub.WT != null ? `WT ${sub.WT}` : ''}
                              {sub.remarks ? ` · ${String(sub.remarks)}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              ) : (
                <p className="text-sm text-gray-500">
                  Not in ERP cache — run <strong>Full sync</strong> first, or refresh if you know this tag exists in ERP.
                </p>
              )}

              {detail.website ? (
                <section>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Website product</h3>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <DetailRow label="Product name" value={detail.website.name} />
                    <DetailRow label="Price" value={detail.website.price != null ? `₹${Number(detail.website.price).toLocaleString('en-IN')}` : null} />
                    <DetailRow label="Availability" value={detail.website.availability_status} />
                    <DetailRow label="Stock qty" value={detail.website.stock_quantity != null ? String(detail.website.stock_quantity) : null} />
                    <DetailRow label="Active" value={detail.website.is_active ? 'Yes' : 'No'} />
                  </dl>
                  <Link
                    href={`/admin/products/${detail.website.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline"
                  >
                    Edit product <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </section>
              ) : (
                <p className="text-sm text-gray-500">No website product with this tag number.</p>
              )}

              {!detail.status.onWebsite && detail.erp && prefillPreview && (
                <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                  <h3 className="text-sm font-semibold text-gray-900">Add to website</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Pick a category from the dropdown, then add manually with ERP fields pre-filled or create an inactive draft.
                  </p>

                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <DetailRow label="Pre-filled name" value={prefillPreview.name} />
                    <DetailRow label="Pre-filled price" value={prefillPreview.price > 0 ? `₹${prefillPreview.price.toLocaleString('en-IN')}` : null} />
                    <DetailRow label="Certificate" value={prefillPreview.certificate_number} />
                    <DetailRow label="Weight" value={prefillPreview.metal_weight_grams ? `${prefillPreview.metal_weight_grams} g` : null} />
                  </dl>

                  <div className="mt-4">
                    <ErpAddProductActions
                      key={`${detail.tgno}-${detail.suggestedKind ?? 'jewellery'}`}
                      tgno={detail.tgno}
                      name={detail.erp.idesc ?? detail.tgno}
                      remarks={detail.erp.remarks}
                      estimatedPrice={detail.erp.estimatedPrice}
                      retailRate={detail.enrichment?.retailRate}
                      gwt={detail.erp.gwt}
                      suggestedKind={detail.suggestedKind}
                      creatingDraft={creatingDraft}
                      onCreateDraft={onCreateDraft}
                    />
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value?.trim() ? value : '—'}</dd>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'green' | 'blue' | 'amber' | 'gray' }) {
  const tones = {
    green: 'bg-emerald-100 text-emerald-800',
    blue: 'bg-sky-100 text-sky-800',
    amber: 'bg-amber-100 text-amber-800',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{label}</span>
  );
}
