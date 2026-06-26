'use client';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DesignMetalRow } from '@/lib/utils/jewelry-design-fields';
import { removeMetalRowFromDesign } from '@/lib/utils/jewelry-design-fields';
import { formatPrice } from '@/lib/utils/format';

interface MetalPricingTableProps {
  rows: DesignMetalRow[];
  metalRates: Record<string, number>;
  settingLaborRates?: Record<string, number>;
  defaultGstPercent?: number;
  onChange: (rows: DesignMetalRow[]) => void;
  previewMetalSlug: string | null;
  onPreviewMetalChange: (slug: string | null) => void;
}

function updateRow(
  rows: DesignMetalRow[],
  slug: string,
  patch: Partial<DesignMetalRow>
): DesignMetalRow[] {
  return rows.map((row) => (row.slug === slug ? { ...row, ...patch } : row));
}

function liveRateForSlug(slug: string, metalRates: Record<string, number>): number | null {
  const rate = metalRates[slug];
  return rate && rate > 0 ? rate : null;
}

export default function MetalPricingTable({
  rows,
  metalRates,
  settingLaborRates = {},
  defaultGstPercent = 3,
  onChange,
  previewMetalSlug,
  onPreviewMetalChange,
}: MetalPricingTableProps) {
  const handleRemoveMetal = (slug: string, label: string) => {
    const target = rows.find((row) => row.slug === slug);
    const availableAfter = rows.filter(
      (row) => row.slug !== slug && row.status === 'available'
    );
    if (target?.status === 'available' && availableAfter.length === 0) {
      toast.error('At least one available metal is required on this design');
      return;
    }
    const next = removeMetalRowFromDesign(rows, slug);
    onChange(next);
    if (previewMetalSlug === slug) {
      onPreviewMetalChange(availableAfter[0]?.slug ?? next[0]?.slug ?? null);
    }
    toast.success(`Removed ${label} — click Save changes to persist`);
  };

  const handlePricingModeChange = (slug: string, mode: DesignMetalRow['pricingMode']) => {
    const profileLabor = settingLaborRates[slug] ?? null;
    onChange(
      updateRow(rows, slug, {
        pricingMode: mode,
        laborRatePercent:
          mode === 'weight'
            ? rows.find((r) => r.slug === slug)?.laborRatePercent ?? profileLabor
            : null,
        fixedPrice: mode === 'fixed' ? rows.find((r) => r.slug === slug)?.fixedPrice ?? null : null,
        weightGrams:
          mode === 'weight' ? rows.find((r) => r.slug === slug)?.weightGrams ?? null : null,
      })
    );
  };

  return (
    <div className="space-y-3">
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          {rows.map((metal) => {
            const rate = liveRateForSlug(metal.slug, metalRates);
            return (
              <span
                key={metal.slug}
                className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray-600"
              >
                <span className="font-medium text-gray-800">{metal.label}:</span>{' '}
                {metal.pricingMode === 'weight'
                  ? rate
                    ? `${formatPrice(rate)}/g`
                    : 'rate not set'
                  : 'fixed'}
              </span>
            );
          })}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
          No metals on this design yet. Use <strong>Add metal</strong> above.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Metal
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Live rate
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Pricing
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Fixed ₹ / Weight (g)
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Labor %
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  GST
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Note
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Preview
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Remove
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.map((row) => {
                const liveRate = liveRateForSlug(row.slug, metalRates);
                const profileLabor = settingLaborRates[row.slug];
                const gstDisplay = row.gstRatePercent ?? defaultGstPercent;
                const laborPlaceholder =
                  profileLabor != null ? String(profileLabor) : '%';

                return (
                  <tr
                    key={row.slug}
                    className={row.status === 'unavailable' ? 'bg-gray-50/80' : undefined}
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">
                      {row.label}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600">
                      {row.pricingMode === 'weight' ? (
                        liveRate ? (
                          formatPrice(liveRate) + '/g'
                        ) : (
                          <span className="text-amber-700">Set in Metals &amp; Pricing</span>
                        )
                      ) : (
                        <span className="text-gray-500">fixed</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.pricingMode}
                        onChange={(e) =>
                          handlePricingModeChange(
                            row.slug,
                            e.target.value as DesignMetalRow['pricingMode']
                          )
                        }
                        className="w-full min-w-[7rem] rounded border border-gray-300 px-2 py-1.5 text-xs"
                      >
                        <option value="weight">Weight + labor %</option>
                        <option value="fixed">Fixed ₹</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.status}
                        onChange={(e) => {
                          const status = e.target.value as DesignMetalRow['status'];
                          onChange(
                            updateRow(rows, row.slug, {
                              status,
                              fixedPrice:
                                status === 'available' && row.pricingMode === 'fixed'
                                  ? row.fixedPrice
                                  : null,
                              weightGrams:
                                status === 'available' && row.pricingMode === 'weight'
                                  ? row.weightGrams
                                  : null,
                            })
                          );
                        }}
                        className="w-full min-w-[8.5rem] rounded border border-gray-300 px-2 py-1.5 text-xs"
                      >
                        <option value="available">Available</option>
                        <option value="on_request">On request (Yes)</option>
                        <option value="unavailable">Not available (X)</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      {row.status === 'available' ? (
                        row.pricingMode === 'fixed' ? (
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={row.fixedPrice ?? ''}
                            onChange={(e) =>
                              onChange(
                                updateRow(rows, row.slug, {
                                  fixedPrice: e.target.value ? Number(e.target.value) : null,
                                })
                              )
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
                              value={row.weightGrams ?? ''}
                              onChange={(e) =>
                                onChange(
                                  updateRow(rows, row.slug, {
                                    weightGrams: e.target.value ? Number(e.target.value) : null,
                                  })
                                )
                              }
                              placeholder="Grams"
                              className="w-24 rounded border border-gray-300 px-2 py-1.5 text-xs"
                            />
                            <span className="text-xs text-gray-400">g</span>
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {row.pricingMode === 'weight' ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={row.laborRatePercent ?? ''}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : null;
                            onChange(updateRow(rows, row.slug, { laborRatePercent: value }));
                          }}
                          placeholder={laborPlaceholder}
                          className="w-16 rounded border border-gray-300 px-2 py-1.5 text-xs"
                          title={
                            profileLabor != null
                              ? `Default from ${profileLabor}% category setting`
                              : 'Labor % for this design'
                          }
                        />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{gstDisplay}%</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={row.note}
                        onChange={(e) =>
                          onChange(updateRow(rows, row.slug, { note: e.target.value }))
                        }
                        placeholder="Optional note"
                        className="w-full min-w-[8rem] rounded border border-gray-300 px-2 py-1.5 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="radio"
                        name="preview-metal"
                        checked={previewMetalSlug === row.slug}
                        disabled={row.status !== 'available'}
                        onChange={() => onPreviewMetalChange(row.slug)}
                        className="h-4 w-4 accent-amber-600"
                        aria-label={`Preview pricing for ${row.label}`}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveMetal(row.slug, row.label)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title={`Remove ${row.label} from this design`}
                        aria-label={`Remove ${row.label}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
