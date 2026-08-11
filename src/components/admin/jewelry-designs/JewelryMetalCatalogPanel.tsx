'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  parseAdminMetalCatalogFromApi,
  type MetalCatalogEntry,
} from '@/lib/utils/metal-pricing-config';
import { formatPrice } from '@/lib/utils/format';
import { JEWELRY_GST_RATE_PERCENT } from '@/lib/constants/jewelry-design-metals';
import {
  getSettingMetalProfile,
  isJewelryProductScope,
  isJewelrySettingType,
  JEWELRY_SETTING_PROFILES_COMMERCE_KEY,
  mergeScopedSettingProfile,
  parseJewelrySettingProfilesFromCommerce,
  productScopeLabel,
  settingTypeLabel,
  type JewelrySettingMetalProfile,
  type JewelrySettingMetalProfiles,
} from '@/lib/utils/jewelry-setting-metal-profiles';

interface AdminMetal extends MetalCatalogEntry {
  id: string;
}

interface JewelryMetalCatalogPanelProps {
  productScope: string;
  settingType: string;
  onCatalogChange?: () => void;
  defaultOpen?: boolean;
}

export default function JewelryMetalCatalogPanel({
  productScope,
  settingType,
  onCatalogChange,
  defaultOpen = true,
}: JewelryMetalCatalogPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [metals, setMetals] = useState<AdminMetal[]>([]);
  const [loading, setLoading] = useState(true);
  const [commerceValues, setCommerceValues] = useState<Record<string, unknown>>({});
  const [profiles, setProfiles] = useState<JewelrySettingMetalProfiles>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [addSlug, setAddSlug] = useState('');
  const [addLabor, setAddLabor] = useState('');

  const scopedScope = isJewelryProductScope(productScope) ? productScope : null;
  const scopedSetting = isJewelrySettingType(settingType) ? settingType : null;

  const profile = useMemo(
    () =>
      getSettingMetalProfile(profiles, scopedScope, scopedSetting, JEWELRY_GST_RATE_PERCENT),
    [profiles, scopedScope, scopedSetting]
  );

  const [profileDraft, setProfileDraft] = useState<JewelrySettingMetalProfile>(profile);

  useEffect(() => {
    setProfileDraft(profile);
  }, [profile, productScope, settingType]);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [metalsRes, commerceRes] = await Promise.all([
        fetch('/api/admin/metals'),
        fetch('/api/admin/commerce'),
      ]);
      if (metalsRes.ok) {
        const data = await metalsRes.json();
        const catalog = parseAdminMetalCatalogFromApi(data) as AdminMetal[];
        setMetals(
          catalog.map((entry) => ({
            ...entry,
            id: entry.id ?? entry.slug,
          }))
        );
      }
      if (commerceRes.ok) {
        const data = await commerceRes.json();
        const values = (data.commerceSettings?.values ?? {}) as Record<string, unknown>;
        setCommerceValues(values);
        setProfiles(parseJewelrySettingProfilesFromCommerce(values));
      }
    } catch {
      toast.error('Failed to load metal catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  const persistProfiles = async (nextProfiles: JewelrySettingMetalProfiles) => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/admin/commerce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'settings',
          payload: {
            ...commerceValues,
            [JEWELRY_SETTING_PROFILES_COMMERCE_KEY]: nextProfiles,
          },
        }),
      });
      if (!res.ok) throw new Error();
      setProfiles(nextProfiles);
      setCommerceValues((prev) => ({
        ...prev,
        [JEWELRY_SETTING_PROFILES_COMMERCE_KEY]: nextProfiles,
      }));
      toast.success(
        `${productScopeLabel(productScope)} ${settingTypeLabel(settingType)} labor saved`
      );
      onCatalogChange?.();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveProfileForSetting = async (draft: JewelrySettingMetalProfile) => {
    if (!scopedSetting || !scopedScope) return;
    const next = mergeScopedSettingProfile(profiles, scopedScope, scopedSetting, draft);
    await persistProfiles(next);
  };

  const configuredSlugs = useMemo(
    () => Object.keys(profileDraft.labor_rates),
    [profileDraft.labor_rates]
  );

  const configuredMetals = useMemo(
    () =>
      configuredSlugs
        .map((slug) => metals.find((m) => m.slug === slug))
        .filter((m): m is AdminMetal => Boolean(m)),
    [configuredSlugs, metals]
  );

  const addableMetals = useMemo(
    () =>
      metals.filter(
        (m) => m.is_active !== false && profileDraft.labor_rates[m.slug] === undefined
      ),
    [metals, profileDraft.labor_rates]
  );

  const updateLaborRate = (slug: string, value: number | null) => {
    setProfileDraft((prev) => {
      const next = { ...prev.labor_rates };
      if (value == null || !Number.isFinite(value)) {
        delete next[slug];
      } else {
        next[slug] = value;
      }
      return { ...prev, labor_rates: next };
    });
  };

  const removeLaborMetal = (slug: string) => {
    setProfileDraft((prev) => {
      const next = { ...prev.labor_rates };
      delete next[slug];
      return { ...prev, labor_rates: next };
    });
  };

  const handleAddMetalLabor = () => {
    if (!addSlug) {
      toast.error('Select a metal');
      return;
    }
    const labor = parseFloat(addLabor);
    if (!Number.isFinite(labor) || labor < 0) {
      toast.error('Enter a valid labor %');
      return;
    }
    updateLaborRate(addSlug, labor);
    setAddSlug('');
    setAddLabor('');
  };

  const title =
    scopedScope && scopedSetting
      ? `${productScopeLabel(scopedScope)} ${settingTypeLabel(scopedSetting)} — labor %`
      : 'Labor % by scope & setting';

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-gray-50"
      >
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {scopedScope && scopedSetting
              ? loading
                ? 'Loading…'
                : `${configuredSlugs.length} metal${configuredSlugs.length === 1 ? '' : 's'} with labor % · GST ${profileDraft.default_gst_percent}% fixed`
              : 'Select Gemstone or Rudraksha and Ring, Pendant, or Bracelet'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/admin/metals"
            onClick={(e) => e.stopPropagation()}
            className="hidden items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 sm:inline-flex"
          >
            Metals &amp; Pricing
            <ExternalLink className="h-3 w-3" />
          </Link>
          {open ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          {!scopedScope || !scopedSetting ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
              Choose a specific <strong>Scope</strong> (Gemstone or Rudraksha) and{' '}
              <strong>Setting</strong> (Ring, Pendant, or Bracelet) to configure labor %.
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-100 bg-amber-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-amber-950">
                  Live ₹/g comes from{' '}
                  <Link href="/admin/metals" className="font-semibold underline">
                    Metals &amp; Pricing
                  </Link>
                  . Set labor % only for metals used in{' '}
                  <strong>
                    {productScopeLabel(scopedScope)} {settingTypeLabel(scopedSetting)}
                  </strong>{' '}
                  designs. Auto GST is{' '}
                  <strong>{profileDraft.default_gst_percent}%</strong> only on weight + labor %
                  metals. Fixed ₹ prices are tax-inclusive (no auto GST). Individual designs can
                  override labor or use a fixed ₹ price instead.
                </p>
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={() => void saveProfileForSetting(profileDraft)}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save {productScopeLabel(scopedScope)} {settingTypeLabel(scopedSetting)} labor
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Metal</th>
                      <th className="px-4 py-3">₹/g (catalog)</th>
                      <th className="px-4 py-3">Labor %</th>
                      <th className="px-4 py-3 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">
                          Loading metals…
                        </td>
                      </tr>
                    ) : configuredMetals.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                          No labor % configured yet. Add a metal below — only metals with labor %
                          appear here.
                        </td>
                      </tr>
                    ) : (
                      configuredMetals.map((metal) => (
                        <tr key={metal.id} className="hover:bg-gray-50/80">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{metal.name}</p>
                            <p className="font-mono text-[10px] text-gray-400">{metal.slug}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium tabular-nums text-gray-600">
                              {formatPrice(metal.price_per_gram)}/g
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              value={profileDraft.labor_rates[metal.slug] ?? ''}
                              onChange={(e) =>
                                updateLaborRate(
                                  metal.slug,
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              placeholder="%"
                              className="w-20 rounded border border-gray-300 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeLaborMetal(metal.slug)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              title="Remove from labor list"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="min-w-[12rem] flex-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Add metal from catalog
                  </label>
                  <select
                    value={addSlug}
                    onChange={(e) => setAddSlug(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    disabled={addableMetals.length === 0}
                  >
                    <option value="">Choose metal…</option>
                    {addableMetals.map((metal) => (
                      <option key={metal.slug} value={metal.slug}>
                        {metal.name}
                        {metal.purity ? ` · ${metal.purity}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Labor %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={addLabor}
                    onChange={(e) => setAddLabor(e.target.value)}
                    placeholder="e.g. 25"
                    className="mt-1 w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMetalLabor}
                  disabled={!addSlug || addableMetals.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              {addableMetals.length === 0 && metals.length > 0 && configuredMetals.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  All catalog metals already have labor % for{' '}
                  {productScopeLabel(scopedScope)} {settingTypeLabel(scopedSetting)}.{' '}
                  <Link href="/admin/metals" className="font-medium text-amber-700 hover:underline">
                    Add a new metal
                  </Link>{' '}
                  in Metals &amp; Pricing first.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
