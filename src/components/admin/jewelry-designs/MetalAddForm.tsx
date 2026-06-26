'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  catalogMetalsAddableToDesign,
  createMetalRowDraftFromProfile,
  type DesignMetalRow,
} from '@/lib/utils/jewelry-design-fields';
import type { MetalCatalogEntry } from '@/lib/utils/metal-pricing-config';
import { formatPrice } from '@/lib/utils/format';

export interface MetalAddDraft {
  pricingMode: 'fixed' | 'weight';
  laborRatePercent: number | null;
  fixedPrice: number | null;
  weightGrams: number | null;
  note: string;
  gstRatePercent: number;
}

interface MetalAddFormProps {
  settingType?: string;
  onMetalAdded?: (entry: MetalCatalogEntry, draft: MetalAddDraft) => void;
  compact?: boolean;
  catalog?: MetalCatalogEntry[];
  metalRows?: DesignMetalRow[];
  metalRates?: Record<string, number>;
  settingLaborRates?: Record<string, number>;
  defaultGstPercent?: number;
  selectOnly?: boolean;
}

const EMPTY_DRAFT: MetalAddDraft = {
  pricingMode: 'fixed',
  laborRatePercent: null,
  fixedPrice: null,
  weightGrams: null,
  note: '',
  gstRatePercent: 3,
};

export default function MetalAddForm({
  settingType = 'ring',
  onMetalAdded,
  compact = false,
  catalog = [],
  metalRows = [],
  metalRates = {},
  settingLaborRates = {},
  defaultGstPercent = 3,
  selectOnly = true,
}: MetalAddFormProps) {
  const addableMetals = useMemo(
    () => catalogMetalsAddableToDesign(catalog, metalRows),
    [catalog, metalRows]
  );

  const [open, setOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [draft, setDraft] = useState<MetalAddDraft>(EMPTY_DRAFT);

  const selectedEntry = useMemo(
    () => catalog.find((m) => m.slug === selectedSlug) ?? null,
    [catalog, selectedSlug]
  );

  const liveRate = useMemo(() => {
    if (!selectedSlug) return null;
    const rate = metalRates[selectedSlug];
    return rate && rate > 0 ? rate : null;
  }, [metalRates, selectedSlug]);

  const profileLabor = selectedSlug ? settingLaborRates[selectedSlug] : undefined;

  useEffect(() => {
    if (!selectedEntry) {
      setDraft({ ...EMPTY_DRAFT, gstRatePercent: defaultGstPercent });
      return;
    }
    setDraft(createMetalRowDraftFromProfile(selectedEntry, settingLaborRates, defaultGstPercent));
  }, [selectedEntry, selectedSlug, settingLaborRates, defaultGstPercent]);

  const handlePricingModeChange = (mode: MetalAddDraft['pricingMode']) => {
    setDraft((prev) => ({
      ...prev,
      pricingMode: mode,
      laborRatePercent:
        mode === 'weight' ? prev.laborRatePercent ?? profileLabor ?? null : null,
      fixedPrice: mode === 'fixed' ? prev.fixedPrice : null,
      weightGrams: mode === 'weight' ? prev.weightGrams : null,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) {
      toast.error('Select a metal from the catalog');
      return;
    }
    if (draft.pricingMode === 'weight') {
      if (!draft.weightGrams || draft.weightGrams <= 0) {
        toast.error('Enter weight in grams for weight-based pricing');
        return;
      }
    } else if (!draft.fixedPrice || draft.fixedPrice <= 0) {
      toast.error('Enter a fixed ₹ price');
      return;
    }

    onMetalAdded?.(selectedEntry, draft);
    toast.success(
      `"${selectedEntry.name ?? selectedEntry.slug}" added — click Save changes to persist`
    );
    setSelectedSlug('');
    setDraft({ ...EMPTY_DRAFT, gstRatePercent: defaultGstPercent });
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedSlug('');
    setDraft({ ...EMPTY_DRAFT, gstRatePercent: defaultGstPercent });
  };

  if (!selectOnly) {
    return null;
  }

  const shellClass = compact
    ? 'rounded-xl border border-gray-200 bg-white p-4 shadow-sm'
    : 'rounded-xl border border-gray-200 bg-gray-50 p-4';

  return (
    <div className={shellClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Add metal to this {settingType}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Select a catalog metal — fields auto-fill from the category labor % when set. Customize
            pricing, then add to this design.
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={catalog.length === 0}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add metal
          </button>
        )}
      </div>

      {catalog.length === 0 && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          No metals in catalog yet.{' '}
          <Link href="/admin/metals" className="font-semibold underline">
            Add metals in Metals &amp; Pricing
          </Link>{' '}
          first.
        </p>
      )}

      {open && catalog.length > 0 && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="design-metal-select"
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Select metal
            </label>
            <select
              id="design-metal-select"
              required
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">Choose from catalog…</option>
              {addableMetals.map((metal) => (
                <option key={metal.slug} value={metal.slug}>
                  {metal.name ?? metal.slug}
                  {metal.purity ? ` · ${metal.purity}` : ''}
                  {settingLaborRates[metal.slug] != null
                    ? ` · ${settingLaborRates[metal.slug]}% labor`
                    : ''}
                </option>
              ))}
            </select>
            {addableMetals.length === 0 ? (
              <p className="mt-2 text-xs text-gray-500">
                Every catalog metal is already on this design.{' '}
                <Link href="/admin/metals" className="text-amber-700 hover:underline">
                  Add a new metal
                </Link>{' '}
                in Metals &amp; Pricing.
              </p>
            ) : null}
          </div>

          {selectedEntry && (
            <div className="overflow-x-auto rounded-lg border border-amber-200 bg-amber-50/40">
              <table className="min-w-full text-sm">
                <thead className="border-b border-amber-200/80 bg-amber-50 text-[11px] font-semibold uppercase tracking-wide text-amber-950">
                  <tr>
                    <th className="px-3 py-2 text-left">Metal</th>
                    <th className="px-3 py-2 text-left">Live rate</th>
                    <th className="px-3 py-2 text-left">Pricing</th>
                    <th className="px-3 py-2 text-left">Fixed ₹ / Weight (g)</th>
                    <th className="px-3 py-2 text-left">Labor %</th>
                    <th className="px-3 py-2 text-left">GST</th>
                    <th className="px-3 py-2 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-900">
                      {selectedEntry.name ?? selectedEntry.slug}
                      {profileLabor != null && (
                        <p className="mt-0.5 text-[10px] font-normal text-emerald-700">
                          Category labor {profileLabor}% applied
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600">
                      {draft.pricingMode === 'weight' ? (
                        liveRate ? (
                          formatPrice(liveRate) + '/g'
                        ) : (
                          <span className="text-amber-700">Set in Metals &amp; Pricing</span>
                        )
                      ) : (
                        <span className="text-gray-500">fixed</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={draft.pricingMode}
                        onChange={(e) =>
                          handlePricingModeChange(e.target.value as MetalAddDraft['pricingMode'])
                        }
                        className="w-full min-w-[7.5rem] rounded border border-gray-300 px-2 py-1.5 text-xs"
                      >
                        <option value="weight">Weight + labor %</option>
                        <option value="fixed">Fixed ₹</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      {draft.pricingMode === 'fixed' ? (
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={draft.fixedPrice ?? ''}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              fixedPrice: e.target.value ? Number(e.target.value) : null,
                            }))
                          }
                          placeholder="Fixed ₹"
                          className="w-28 rounded border border-gray-300 px-2 py-1.5 text-xs"
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={draft.weightGrams ?? ''}
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                weightGrams: e.target.value ? Number(e.target.value) : null,
                              }))
                            }
                            placeholder="Grams"
                            className="w-24 rounded border border-gray-300 px-2 py-1.5 text-xs"
                          />
                          <span className="text-xs text-gray-400">g</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {draft.pricingMode === 'weight' ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={draft.laborRatePercent ?? ''}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              laborRatePercent: e.target.value ? Number(e.target.value) : null,
                            }))
                          }
                          placeholder={profileLabor != null ? String(profileLabor) : '%'}
                          className="w-16 rounded border border-gray-300 px-2 py-1.5 text-xs"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">{draft.gstRatePercent}%</td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={draft.note}
                        onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                        placeholder="Optional"
                        className="w-full min-w-[6rem] rounded border border-gray-300 px-2 py-1.5 text-xs"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={!selectedSlug}
              className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Add to design
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <Link
              href="/admin/metals"
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-amber-700"
            >
              Manage catalog
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
