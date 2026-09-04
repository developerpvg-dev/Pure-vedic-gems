'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  JEWELRY_DESIGN_SETTING_TYPES,
  JEWELRY_GST_RATE_PERCENT,
  JEWELRY_PRODUCT_SCOPES,
  RUDRAKSHA_MOUNTING_CATEGORIES,
} from '@/lib/constants/jewelry-design-metals';
import {
  applyMetalRowToDesign,
  decodeMetalRowsFromDesign,
  DEFAULT_STONE_ADDON_LABEL,
  getDesignDiamondChargeFromDesign,
  getStoneAddonLabelFromDesign,
  laborRatesFromMetalRows,
  type DesignMetalRow,
} from '@/lib/utils/jewelry-design-fields';
import {
  parseAdminMetalCatalogFromApi,
  pricingModesFromCatalog,
  ratesBySlugFromCatalog,
  type MetalCatalogEntry,
} from '@/lib/utils/metal-pricing-config';
import {
  applySettingProfileDefaultsToRows,
  getSettingMetalProfile,
  parseJewelrySettingProfilesFromCommerce,
  type JewelrySettingMetalProfiles,
} from '@/lib/utils/jewelry-setting-metal-profiles';
import MetalPricingTable from '@/components/admin/jewelry-designs/MetalPricingTable';
import DesignPricingPreview from '@/components/admin/jewelry-designs/DesignPricingPreview';
import MetalAddForm, { type MetalAddDraft } from '@/components/admin/jewelry-designs/MetalAddForm';
import { designHref } from '@/lib/designs/public';
import { absoluteUrl } from '@/lib/utils/seo';

export interface AdminJewelryDesign {
  id: string;
  name: string;
  setting_type: string;
  image_url: string | null;
  video_url?: string | null;
  description: string | null;
  making_charges: Record<string, number>;
  estimated_metal_weight: Record<string, number> | null;
  diamond_charges?: Record<string, number> | null;
  stone_addon_label?: string | null;
  metal_flags?: Record<string, string> | null;
  labor_rates?: Record<string, number> | null;
  product_scope: string;
  rudraksha_category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface DesignFormProps {
  design: AdminJewelryDesign | null;
  onClose: () => void;
  onSuccess: () => void;
  onCatalogChange?: () => void;
}

export default function DesignForm({ design, onClose, onSuccess, onCatalogChange }: DesignFormProps) {
  const [name, setName] = useState(design?.name ?? '');
  const [settingType, setSettingType] = useState(design?.setting_type ?? 'ring');
  const [productScope, setProductScope] = useState<'gemstone' | 'rudraksha'>(
    (design?.product_scope as 'gemstone' | 'rudraksha') ?? 'gemstone'
  );
  const [rudrakshaCategory, setRudrakshaCategory] = useState(
    design?.rudraksha_category ?? 'standard_mukhi'
  );
  const [description, setDescription] = useState(design?.description ?? '');
  const [imageUrl, setImageUrl] = useState(design?.image_url ?? '');
  const [videoUrl, setVideoUrl] = useState(design?.video_url ?? '');
  const [sortOrder, setSortOrder] = useState(design?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(design?.is_active ?? true);
  const [metalRows, setMetalRows] = useState<DesignMetalRow[]>(() =>
    design ? decodeMetalRowsFromDesign(design) : []
  );
  const [designDiamondCharge, setDesignDiamondCharge] = useState<number | null>(() =>
    design ? getDesignDiamondChargeFromDesign(design.diamond_charges) : null
  );
  const [stoneAddonLabel, setStoneAddonLabel] = useState(() =>
    design ? getStoneAddonLabelFromDesign(design) ?? '' : ''
  );
  const [previewMetalSlug, setPreviewMetalSlug] = useState<string | null>(null);
  const [metalRates, setMetalRates] = useState<Record<string, number>>({});
  const [metalCatalog, setMetalCatalog] = useState<MetalCatalogEntry[]>([]);
  const [defaultGst, setDefaultGst] = useState(JEWELRY_GST_RATE_PERCENT);
  const [settingProfiles, setSettingProfiles] = useState<JewelrySettingMetalProfiles>({});
  const [pricingModes, setPricingModes] = useState<Record<string, 'weight' | 'fixed_sheet'>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const hydratedForRef = useRef<string | null>(null);

  const loadCatalog = async () => {
    const [metalsRes, commerceRes, profilesRes] = await Promise.all([
      fetch('/api/admin/metals'),
      fetch('/api/admin/commerce'),
      fetch('/api/jewelry/setting-profiles'),
    ]);
    let profileGst = JEWELRY_GST_RATE_PERCENT;
    if (commerceRes.ok) {
      const commerce = await commerceRes.json();
      const values = commerce.commerceSettings?.values ?? {};
      const profiles = parseJewelrySettingProfilesFromCommerce(values);
      setSettingProfiles(profiles);
      profileGst = getSettingMetalProfile(profiles, productScope, settingType).default_gst_percent;
    }
    if (profilesRes.ok) {
      const data = await profilesRes.json();
      const profiles = data.profiles as JewelrySettingMetalProfiles;
      setSettingProfiles(profiles);
      profileGst = getSettingMetalProfile(profiles, productScope, settingType).default_gst_percent;
    }
    setDefaultGst(profileGst);

    const data: unknown = metalsRes.ok ? await metalsRes.json() : { metals: [] };
    const catalog = parseAdminMetalCatalogFromApi(data);
    if (catalog.length > 0) {
      setMetalCatalog(catalog);
      setMetalRates(ratesBySlugFromCatalog(catalog));
      setPricingModes(pricingModesFromCatalog(catalog));
    }
    return catalog;
  };

  useEffect(() => {
    const hydrateKey = `${design?.id ?? 'new'}:${productScope}:${settingType}`;

    void (async () => {
      try {
        const [catalog, profilesRes] = await Promise.all([
          loadCatalog(),
          fetch('/api/jewelry/setting-profiles'),
        ]);
        const profiles = profilesRes.ok
          ? ((await profilesRes.json()) as { profiles: JewelrySettingMetalProfiles }).profiles
          : null;

        // Avoid overwriting metals the user added while catalog was still loading.
        if (hydratedForRef.current === hydrateKey) {
          return;
        }
        hydratedForRef.current = hydrateKey;

        const baseRows = design ? decodeMetalRowsFromDesign(design, catalog) : [];
        setMetalRows(
          applySettingProfileDefaultsToRows(baseRows, productScope, settingType, profiles)
        );
      } catch {
        // loadCatalog handles errors
      }
    })();
  }, [design?.id, productScope, settingType]);

  const settingLaborRates = useMemo(
    () => getSettingMetalProfile(settingProfiles, productScope, settingType).labor_rates,
    [settingProfiles, productScope, settingType]
  );

  const handleMetalAdded = (entry: MetalCatalogEntry, draft: MetalAddDraft) => {
    setMetalRows((rows) => applyMetalRowToDesign(rows, entry, draft));
    setPreviewMetalSlug(entry.slug);
  };

  const designLaborRates = useMemo(() => laborRatesFromMetalRows(metalRows), [metalRows]);

  const firstAvailableMetal = useMemo(
    () => metalRows.find((row) => row.status === 'available')?.slug ?? null,
    [metalRows]
  );

  useEffect(() => {
    if (!previewMetalSlug && firstAvailableMetal) {
      setPreviewMetalSlug(firstAvailableMetal);
    }
  }, [firstAvailableMetal, previewMetalSlug]);

  useEffect(() => {
    if (productScope === 'rudraksha') {
      setSettingType('pendant');
    }
  }, [productScope]);

  const handleImageUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('files', file);
      form.append('bucket', 'jewelry-designs');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || payload.errors?.[0] || 'Upload failed');
      }
      const publicUrl = Array.isArray(payload.urls) ? payload.urls[0] : null;
      if (!publicUrl) throw new Error('Upload returned no URL');

      setImageUrl(publicUrl);
      toast.success('Image uploaded to storage');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        ...(design ? { id: design.id } : {}),
        name: name.trim(),
        setting_type: settingType,
        product_scope: productScope,
        rudraksha_category: productScope === 'rudraksha' ? rudrakshaCategory : null,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        video_url: videoUrl.trim() || null,
        sort_order: sortOrder,
        is_active: isActive,
        design_diamond_charge: designDiamondCharge,
        stone_addon_label: stoneAddonLabel.trim() || null,
        metal_rows: metalRows.map((row) => ({
          ...row,
          note: row.note ?? '',
        })),
      };

      const res = await fetch('/api/admin/designs', {
        method: design ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = payload.details?.fieldErrors
          ? Object.values(payload.details.fieldErrors).flat().join(', ')
          : payload.error;
        throw new Error(detail || 'Failed to save design');
      }

      if (payload.warning) {
        toast.warning(payload.warning);
      }

      toast.success(design ? 'Design updated' : 'Design created');
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  const publicPagePath = designHref({
    name: name.trim() || design?.name || '',
    setting_type: settingType,
    product_scope: productScope,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-900">
          {design ? 'Edit Jewelry Design' : 'Add Jewelry Design'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Add metals from the catalog, choose weight + labor % or fixed ₹ per metal. Labor %
          auto-fills from the {productScope} {settingType} category when configured. Weight +
          labor % adds 3% GST automatically; fixed ₹ prices are tax-inclusive (no auto GST).
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product scope</label>
              <select
                value={productScope}
                onChange={(e) => setProductScope(e.target.value as 'gemstone' | 'rudraksha')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {JEWELRY_PRODUCT_SCOPES.map((scope) => (
                  <option key={scope} value={scope}>
                    {scope === 'gemstone' ? 'Gemstone jewellery' : 'Rudraksha mounting'}
                  </option>
                ))}
              </select>
            </div>

            {productScope === 'rudraksha' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Rudraksha category</label>
                <select
                  value={rudrakshaCategory}
                  onChange={(e) => setRudrakshaCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {RUDRAKSHA_MOUNTING_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Setting type</label>
              <select
                value={settingType}
                onChange={(e) => setSettingType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {JEWELRY_DESIGN_SETTING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Design name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. Design-14 or Rudraksha - One Mukhi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Optional notes shown in configurator"
              />
              {publicPagePath ? (
                <p className="mt-1.5 text-xs text-gray-500">
                  Public page:{' '}
                  <a
                    href={publicPagePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-amber-800 underline-offset-2 hover:underline"
                  >
                    {absoluteUrl(publicPagePath)}
                  </a>
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sort order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <label className="mt-6 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Active in configurator
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Design image</label>
              <p className="text-xs text-gray-400">
                Uploaded to Supabase Storage. Seeded designs may use /public paths until re-uploaded.
              </p>
              <div className="mt-2 flex items-center gap-3">
                {imageUrl ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200">
                    <Image src={imageUrl} alt="Preview" fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute right-0.5 top-0.5 rounded-full bg-white p-0.5 shadow"
                    >
                      <X className="h-3 w-3 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-amber-400"
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    ) : (
                      <Upload className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.currentTarget.value = '';
                    if (file) void handleImageUpload(file);
                  }}
                />
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste image URL /public path"
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">YouTube video URL</label>
              <p className="text-xs text-gray-400">Optional. Shows a Video button on the design card in the configurator.</p>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <DesignPricingPreview
            metalRows={metalRows}
            metalRates={metalRates}
            laborRates={designLaborRates}
            pricingModes={pricingModes}
            metalCatalog={metalCatalog}
            defaultGstPercent={defaultGst}
            previewMetalSlug={previewMetalSlug}
            designDiamondCharge={designDiamondCharge}
            stoneAddonLabel={stoneAddonLabel}
          />
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Metal pricing matrix</h3>
          <p className="mt-1 text-xs text-gray-500">
            Pick metals for this {settingType} design. Use <strong>Weight + labor %</strong> when the
            category has a labor rate, or <strong>Fixed ₹</strong> for sheet-style pricing. Override
            labor % per design if needed.
          </p>

          <div className="mt-4">
            <MetalAddForm
              settingType={settingType}
              compact
              catalog={metalCatalog}
              metalRows={metalRows}
              metalRates={metalRates}
              settingLaborRates={settingLaborRates}
              defaultGstPercent={defaultGst}
              selectOnly
              onMetalAdded={(entry, draft) => handleMetalAdded(entry, draft)}
            />
          </div>

          <div className="mt-4 grid max-w-xl gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Extra stone / gem type
              </label>
              <p className="text-xs text-gray-500">
                e.g. Diamond, Ruby, Emerald — applies to all available metals for this design.
              </p>
              <input
                type="text"
                value={stoneAddonLabel}
                onChange={(e) => setStoneAddonLabel(e.target.value)}
                placeholder={DEFAULT_STONE_ADDON_LABEL}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Add-on price (₹)
              </label>
              <p className="text-xs text-gray-500">
                e.g. Design-14: ₹17,500 on every metal when set.
              </p>
              <input
                type="number"
                min={0}
                step={1}
                value={designDiamondCharge ?? ''}
                onChange={(e) =>
                  setDesignDiamondCharge(e.target.value ? Number(e.target.value) : null)
                }
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-3">
            <MetalPricingTable
              rows={metalRows}
              metalRates={metalRates}
              settingLaborRates={settingLaborRates}
              defaultGstPercent={defaultGst}
              onChange={setMetalRows}
              previewMetalSlug={previewMetalSlug}
              onPreviewMetalChange={setPreviewMetalSlug}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {design ? 'Save changes' : 'Create design'}
          </button>
        </div>
      </div>
    </div>
  );
}
