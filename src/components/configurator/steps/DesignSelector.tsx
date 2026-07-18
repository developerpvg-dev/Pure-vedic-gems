'use client';

/**
 * Step 4 — Select Design (Compact)
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDesignConfiguratorNote } from '@/lib/utils/jewelry-design-fields';
import { createClient } from '@/lib/supabase/client';
import type { JewelryDesign } from '@/lib/types/database';
import type { ProductCard } from '@/lib/types/product';
import type { CustomDesignBrief, SettingType, GemCategory } from '@/lib/types/configurator';
import type { ConfiguratorOptionRules } from '@/lib/utils/configurator-rules';
import { DesignImageLightbox } from '@/components/configurator/DesignImageLightbox';
import CustomDesignDetailsForm from '@/components/configurator/CustomDesignDetailsForm';
import { designImageSrc } from '@/lib/utils/design-image';
import {
  designMatchesRudrakshaSelection,
  getRudrakshaDesignCategoriesForSelection,
  isRudrakshaConfiguratorContext,
  RUDRAKSHA_DESIGN_CATEGORIES,
  type RudrakshaDesignCategory,
} from '@/lib/utils/rudraksha-design-rules';

interface DesignSelectorProps {
  settingType: SettingType;
  gemCategory: GemCategory | null;
  selectedProduct: ProductCard | null;
  rudrakshaComboProducts?: ProductCard[];
  selected: JewelryDesign | null;
  customDesignUrl: string | null;
  customDesignBrief: CustomDesignBrief | null;
  optionRules: ConfiguratorOptionRules | null;
  onSelectDesign: (design: JewelryDesign) => void;
  onCustomDesignUpload: (url: string) => void;
  onCustomDesignBriefSubmit: (brief: CustomDesignBrief) => void;
  onClearCustomDesign: () => void;
}

const MAX_CUSTOM_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_CUSTOM_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const ACCEPTED_CUSTOM_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.pdf';

export default function DesignSelector({
  settingType,
  gemCategory,
  selectedProduct,
  rudrakshaComboProducts = [],
  selected,
  customDesignUrl,
  customDesignBrief,
  optionRules,
  onSelectDesign,
  onCustomDesignUpload,
  onCustomDesignBriefSubmit,
  onClearCustomDesign,
}: DesignSelectorProps) {
  const [designs, setDesigns] = useState<JewelryDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customUploadError, setCustomUploadError] = useState<string | null>(null);
  const [customUploading, setCustomUploading] = useState(false);
  const [previewDesign, setPreviewDesign] = useState<JewelryDesign | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customDesignEnabled = optionRules?.jewelry_design_enabled ?? true;
  const rudrakshaFlow = isRudrakshaConfiguratorContext(gemCategory, selectedProduct);
  const allowedRudrakshaCategories = rudrakshaFlow
    ? getRudrakshaDesignCategoriesForSelection(selectedProduct, rudrakshaComboProducts)
    : [];
  const showCustomDetailsForm = !!customDesignUrl && !customDesignBrief;

  useEffect(() => {
    async function fetchDesigns() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        let query = supabase
          .from('jewelry_designs')
          .select('*')
          .eq('setting_type', settingType)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (rudrakshaFlow) {
          query = query.eq('product_scope', 'rudraksha');
        } else {
          query = query.eq('product_scope', 'gemstone');
        }

        const { data, error: fetchErr } = await query;
        if (fetchErr) throw fetchErr;

        let rows = (data as JewelryDesign[]) ?? [];
        if (rudrakshaFlow) {
          rows = rows.filter((design) =>
            designMatchesRudrakshaSelection(
              design.rudraksha_category,
              selectedProduct,
              rudrakshaComboProducts
            )
          );
        }

        setDesigns(rows);
      } catch {
        setDesigns([]);
        setError('Failed to load designs. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchDesigns();
  }, [settingType, gemCategory, selectedProduct, rudrakshaComboProducts, rudrakshaFlow]);

  const selectedDesignNote = selected ? getDesignConfiguratorNote(selected) : null;

  function validateCustomFile(file: File): string | null {
    if (!ACCEPTED_CUSTOM_TYPES.includes(file.type)) {
      return 'Please upload a JPG, PNG, WebP, or PDF file.';
    }

    if (file.size > MAX_CUSTOM_FILE_SIZE) {
      return 'File size must be under 10MB.';
    }

    return null;
  }

  async function uploadCustomFile(file: File) {
    const validationError = validateCustomFile(file);
    if (validationError) {
      setCustomUploadError(validationError);
      return;
    }

    setCustomUploadError(null);
    setCustomUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/custom-design', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Upload failed. Please try again.');
      }

      const publicUrl = payload.publicUrl as string | undefined;
      if (!publicUrl) {
        throw new Error('Upload failed. Please try again.');
      }

      onCustomDesignUpload(publicUrl);
    } catch (uploadError) {
      setCustomUploadError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Upload failed. Please try again.'
      );
    } finally {
      setCustomUploading(false);
    }
  }

  async function handleCustomFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    await uploadCustomFile(file);
  }

  function renderCustomUploadTile() {
    return (
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={customUploading || !customDesignEnabled}
        className={cn(
          'group flex min-h-[152px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 text-center transition-all',
          'hover:border-accent hover:bg-accent/5',
          customDesignUrl ? 'border-accent bg-accent/5' : 'border-border',
          customUploading && 'cursor-wait opacity-80',
          !customDesignEnabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {customUploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground group-hover:text-accent" />
        )}
        <span className="mt-2 text-[11px] font-semibold text-primary">
          {customUploading
            ? 'Uploading...'
            : !customDesignEnabled
              ? 'Custom unavailable'
              : customDesignUrl
                ? 'Reference uploaded ✓'
                : 'Upload Custom Design'}
        </span>
        <span className="mt-1 text-[9px] text-muted-foreground">
          Share a sketch or reference image
        </span>
      </button>
    );
  }

  function renderDesignCard(design: JewelryDesign) {
    const isChosen = selected?.id === design.id;
    return (
      <div
        key={design.id}
        className={cn(
          'group relative overflow-hidden rounded-lg border text-left transition-all duration-150',
          'hover:border-accent hover:shadow-sm',
          isChosen
            ? 'border-accent ring-1 ring-accent/30 shadow-sm'
            : 'border-border'
        )}
      >
        <button
          type="button"
          onClick={() => onSelectDesign(design)}
          aria-pressed={isChosen}
          className="w-full text-left"
        >
          <div className="relative aspect-square overflow-hidden bg-[#faf8f5]">
            {design.image_url ? (
              <img
                src={designImageSrc(design.image_url)}
                alt={design.name}
                className="h-full w-full object-contain p-1.5"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl">📿</div>
            )}
            {isChosen && (
              <div className="absolute inset-0 flex items-center justify-center bg-accent/15">
                <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-semibold text-accent-foreground">✓</span>
              </div>
            )}
          </div>
          <div className="p-1.5">
            <p className="truncate text-[11px] font-medium text-primary">{design.name}</p>
          </div>
        </button>

        {design.image_url ? (
          <button
            type="button"
            onClick={() => setPreviewDesign(design)}
            className="absolute right-1.5 top-1.5 z-10 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-medium text-primary shadow-sm ring-1 ring-black/10 backdrop-blur-sm transition hover:bg-accent hover:text-accent-foreground"
            aria-label={`View ${design.name} in full size`}
          >
            View
          </button>
        ) : null}
      </div>
    );
  }

  const groupedDesigns = useMemo(() => {
    if (!rudrakshaFlow) return null;
    const groups = new Map<RudrakshaDesignCategory, JewelryDesign[]>();
    for (const design of designs) {
      const category = design.rudraksha_category as RudrakshaDesignCategory | null;
      if (!category || !(category in RUDRAKSHA_DESIGN_CATEGORIES)) continue;
      const list = groups.get(category) ?? [];
      list.push(design);
      groups.set(category, list);
    }
    return allowedRudrakshaCategories
      .map((category) => ({
        category,
        meta: RUDRAKSHA_DESIGN_CATEGORIES[category],
        items: groups.get(category) ?? [],
      }))
      .filter((group) => group.items.length > 0);
  }, [allowedRudrakshaCategories, designs, rudrakshaFlow]);

  return (
    <div>
      {showCustomDetailsForm && customDesignUrl ? (
        <CustomDesignDetailsForm
          imageUrl={customDesignUrl}
          initial={customDesignBrief}
          onSubmit={onCustomDesignBriefSubmit}
          onCancel={onClearCustomDesign}
        />
      ) : null}

      {!showCustomDetailsForm && customDesignBrief && customDesignUrl ? (
        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-green-900">Custom design request saved</p>
          <p className="mt-1 text-[11px] leading-relaxed text-green-800">
            Our design team will contact you soon at {customDesignBrief.contact_phone} to discuss your
            custom piece.
          </p>
          <button
            type="button"
            onClick={onClearCustomDesign}
            className="mt-2 text-[11px] font-medium text-green-900 underline"
          >
            Upload a different reference
          </button>
        </div>
      ) : null}

      {!showCustomDetailsForm && (
        <>
          {loading ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="mt-4 flex flex-col items-center gap-2 py-8 text-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p className="text-xs font-medium text-primary">{error}</p>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              {rudrakshaFlow && allowedRudrakshaCategories.length > 0 && (
                <div className="mb-3 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
                  <p className="text-xs font-semibold text-primary">Rudraksha mounting options</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Showing designs for:{' '}
                    {allowedRudrakshaCategories
                      .map((category) => RUDRAKSHA_DESIGN_CATEGORIES[category].label)
                      .join(' · ')}
                  </p>
                  {rudrakshaComboProducts.length > 0 && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Combo beads:{' '}
                      {[selectedProduct?.name, ...rudrakshaComboProducts.map((item) => item.name)]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>
              )}

              {rudrakshaFlow && groupedDesigns && groupedDesigns.length > 0 ? (
                <div className="mt-3 space-y-4">
                  {groupedDesigns.map((group) => (
                    <div key={group.category}>
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-primary">{group.meta.label}</p>
                        <p className="text-[11px] text-muted-foreground">{group.meta.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        {group.items.map((design) => renderDesignCard(design))}
                        {group.category === allowedRudrakshaCategories[allowedRudrakshaCategories.length - 1]
                          ? renderCustomUploadTile()
                          : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {designs.map((design) => renderDesignCard(design))}
                  {renderCustomUploadTile()}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_CUSTOM_EXTENSIONS}
                onChange={handleCustomFileChange}
                className="hidden"
              />

              {customUploadError && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  {customUploadError}
                </div>
              )}

              {selectedDesignNote && (
                <div className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-900/80">
                    Design note — {selected?.name}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-amber-950/90">
                    {selectedDesignNote}
                  </p>
                </div>
              )}

              {designs.length === 0 && !customUploading && (
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {rudrakshaFlow
                    ? 'No mounting designs match this Rudraksha selection yet. Upload a custom design.'
                    : 'No designs available. Upload a custom design.'}
                </p>
              )}
            </>
          )}
        </>
      )}

      <DesignImageLightbox
        open={previewDesign !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewDesign(null);
        }}
        imageUrl={previewDesign?.image_url ?? null}
        title={previewDesign?.name ?? 'Design preview'}
      />
    </div>
  );
}
