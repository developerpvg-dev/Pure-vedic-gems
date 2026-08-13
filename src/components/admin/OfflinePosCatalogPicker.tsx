'use client';

/**
 * Offline POS catalog: same category → browse flow as the storefront configurator.
 */

import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import GemCategorySelector from '@/components/configurator/steps/GemCategorySelector';
import GemBrowser from '@/components/configurator/steps/GemBrowser';
import type { GemCategory } from '@/lib/types/configurator';
import type { ProductCard } from '@/lib/types/product';
import { isRudrakshaConfiguratorContext } from '@/lib/utils/rudraksha-design-rules';
import { isRudrakshaStorefrontSlug } from '@/lib/constants/rudraksha-subcategories';
import '@/app/configure/configurator-page.css';

export function OfflinePosCatalogPicker({
  onConfigure,
  onAddLoose,
}: {
  onConfigure: (product: ProductCard, comboProductIds?: string[]) => void;
  onAddLoose: (products: ProductCard[]) => void;
}) {
  const [gemCategory, setGemCategory] = useState<GemCategory | null>(null);
  const [selected, setSelected] = useState<ProductCard | null>(null);
  const [combo, setCombo] = useState<ProductCard[]>([]);

  const rudrakshaMode = useMemo(() => {
    if (!gemCategory) return false;
    if (gemCategory === 'rudraksha' || isRudrakshaStorefrontSlug(gemCategory)) return true;
    return isRudrakshaConfiguratorContext(gemCategory, selected);
  }, [gemCategory, selected]);

  if (!gemCategory) {
    return (
      <div className="rounded-xl border border-stone-200 bg-[#fffaf2] p-3 sm:p-4">
        <p className="mb-3 text-sm font-medium text-stone-800">
          Choose a category (Navaratna, Uparatna, or Rudraksha) — same as the website configurator.
        </p>
        <GemCategorySelector
          selected={null}
          onSelect={(category) => {
            setGemCategory(category);
            setSelected(null);
            setCombo([]);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-[#fffaf2] p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            setGemCategory(null);
            setSelected(null);
            setCombo([]);
          }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700 hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Change category
        </button>
        <p className="text-xs text-stone-500">
          {rudrakshaMode
            ? 'Add selected beads as loose, or continue to configure a pendant.'
            : 'Select a stone to configure. Buy loose is in the configurator.'}
        </p>
      </div>

      <GemBrowser
        category={gemCategory}
        selected={selected}
        {...(rudrakshaMode
          ? {
              rudrakshaMode: true as const,
              comboProducts: combo,
              onToggleCombo: (product: ProductCard) => {
                setCombo((prev) => {
                  const exists = prev.some((p) => p.id === product.id);
                  if (exists) return prev.filter((p) => p.id !== product.id);
                  return [...prev, product];
                });
                setSelected((current) => current ?? product);
              },
              onContinueRudraksha: () => {
                const primary = selected ?? combo[0];
                if (!primary) return;
                const comboIds = [
                  primary.id,
                  ...combo.map((p) => p.id).filter((id) => id !== primary.id),
                ];
                onConfigure(primary, comboIds);
              },
              onAddLoose: (products: ProductCard[]) => {
                onAddLoose(products);
                setSelected(null);
                setCombo([]);
              },
            }
          : {})}
        onSelect={(product) => {
          setSelected(product);
          if (!rudrakshaMode) {
            onConfigure(product);
          }
        }}
      />
    </div>
  );
}
