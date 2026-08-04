'use client';

/**
 * Step 5 — Metal & Size selection
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';
import { METAL_OPTIONS } from '@/lib/types/configurator';
import type { MetalId, MetalOption, SettingType, GoldRateData } from '@/lib/types/configurator';
import type { JewelryDesign } from '@/lib/types/database';
import {
  getAllowedRingSizeSystems,
  isMetalAllowed,
  parseRingSizeValue,
  RING_SIZE_SYSTEMS,
  type ConfiguratorOptionRules,
  type RingSizeSystemId,
} from '@/lib/utils/configurator-rules';
import {
  calculateJewelryDesignPricing,
  isMetalAvailableForDesign,
} from '@/lib/utils/jewelry-pricing';
import { getStoneAddonLabelFromDesign } from '@/lib/utils/jewelry-design-fields';
import { resolveMetalRatePerGram } from '@/lib/hooks/useManualMetalPrices';
import type { MetalPricingMode } from '@/lib/utils/metal-pricing-config';
import { jewelleryPriceInclGst } from '@/lib/utils/tax';
import MetalTrustMarquee from '@/components/configurator/MetalTrustMarquee';

interface MetalSizeSelectorProps {
  settingType: SettingType;
  metal: MetalId | null;
  ringSize: string | null;
  goldRate: GoldRateData | null;
  laborRates?: Record<string, number> | null;
  pricingModes?: Record<string, MetalPricingMode> | null;
  ratesBySlug?: Record<string, number> | null;
  selectedDesign: JewelryDesign | null;
  /** Customer-uploaded design — metal/size are preferences; mounting priced later. */
  isCustomDesign?: boolean;
  optionRules: ConfiguratorOptionRules | null;
  onMetalChange: (metal: MetalId) => void;
  onRingSizeChange: (size: string | null) => void;
}

type MetalEstimate = ReturnType<typeof getEstimatedMetalPrice>;

interface MetalPriceLine {
  label: string;
  detail?: string;
  amount: number;
}

function getEstimatedMetalPrice(
  metalSlug: string,
  design: JewelryDesign | null,
  goldRate: GoldRateData | null,
  laborRates?: Record<string, number> | null,
  pricingModes?: Record<string, MetalPricingMode> | null,
  ratesBySlug?: Record<string, number> | null
): {
  weight: number;
  rate: number;
  total: number;
  pricingKind: 'weight' | 'fixed';
  laborRatePercent: number;
  makingCharge: number;
  metalPrice: number;
  diamondCharge: number;
} {
  if (!design || !goldRate) {
    return {
      weight: 0,
      rate: 0,
      total: 0,
      pricingKind: 'fixed',
      laborRatePercent: 0,
      makingCharge: 0,
      metalPrice: 0,
      diamondCharge: 0,
    };
  }
  const rate = resolveMetalRatePerGram(metalSlug, goldRate, ratesBySlug);
  const pricing = calculateJewelryDesignPricing({
    metal: metalSlug,
    makingCharges: design.making_charges,
    estimatedMetalWeight: design.estimated_metal_weight,
    diamondCharges: design.diamond_charges,
    metalRatePerGram: rate,
    laborRates,
    pricingModes,
  });
  return {
    weight: pricing.metalWeightGrams,
    rate,
    total: pricing.metalPrice + pricing.makingCharge + pricing.diamondCharge,
    pricingKind: pricing.pricingKind,
    laborRatePercent: pricing.laborRatePercent,
    makingCharge: pricing.makingCharge,
    metalPrice: pricing.metalPrice,
    diamondCharge: pricing.diamondCharge,
  };
}

function buildMetalPriceLines(
  estimate: MetalEstimate,
  stoneLabel?: string | null
): MetalPriceLine[] {
  // ponytail: metal+labor folded into Est. mounting; only surface stone add-on if present
  // Amounts are tax-inclusive (jewellery 3%); gem never taxed.
  if (estimate.diamondCharge <= 0) return [];
  return [
    {
      label: stoneLabel?.trim() || 'Diamond',
      amount: jewelleryPriceInclGst(estimate.diamondCharge),
      detail: 'incl. GST',
    },
  ];
}

function apiToMetalOption(item: Record<string, unknown>): MetalOption {
  return {
    id: String(item.slug ?? item.id),
    label: String(item.name ?? ''),
    purity: item.purity ? String(item.purity) : undefined,
    price_per_gram: typeof item.price_per_gram === 'number' ? item.price_per_gram : undefined,
  };
}

const FALLBACK_METALS: MetalOption[] = METAL_OPTIONS.map((m) => ({
  id: m.id,
  label: m.label,
}));

function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground',
        className
      )}
    >
      {children}
    </p>
  );
}

function MetalOptionCard({
  option,
  isSelected,
  estimate,
  stoneLabel,
  hasRates,
  onSelect,
}: {
  option: MetalOption;
  isSelected: boolean;
  estimate: MetalEstimate;
  stoneLabel: string | null;
  hasRates: boolean;
  onSelect: () => void;
}) {
  const priceLines = hasRates ? buildMetalPriceLines(estimate, stoneLabel) : [];
  const showTotal = hasRates && estimate.total > 0;
  // Tax-inclusive jewellery display (3% baked in); gem never taxed.
  const mountingIncl = jewelleryPriceInclGst(
    estimate.metalPrice + estimate.makingCharge,
  );
  const totalIncl = jewelleryPriceInclGst(estimate.total);
  // When the only line equals the total (flat fee), skip the duplicate footer
  const showBreakdown =
    priceLines.length > 0 &&
    !(priceLines.length === 1 && priceLines[0].amount === totalIncl);
  const mountingDisplay = showBreakdown ? mountingIncl : totalIncl;

  return (
    <button
      type="button"
      onClick={onSelect}
      role="radio"
      aria-checked={isSelected}
      className={cn(
        'pvg-metal-card group relative flex w-full flex-col rounded-xl border text-left transition-all duration-150',
        'hover:border-accent/50 hover:shadow-sm',
        isSelected
          ? 'border-accent bg-accent/[0.05] shadow-[0_4px_16px_rgba(201,168,76,0.12)] ring-1 ring-accent/25'
          : 'border-border/70 bg-white'
      )}
    >
      <div className="flex items-start justify-between gap-2 px-3.5 pt-3.5 pb-2">
        <div className="min-w-0">
          <p
            className={cn(
              'text-[13px] font-semibold leading-snug',
              isSelected ? 'text-accent' : 'text-primary'
            )}
          >
            {option.label}
          </p>
          {option.purity ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{option.purity}</p>
          ) : null}
        </div>

        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
            isSelected
              ? 'border-accent bg-accent text-accent-foreground'
              : 'border-border/80 bg-white text-transparent group-hover:border-accent/40'
          )}
          aria-hidden
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      </div>

      {showTotal ? (
        <div className="border-t border-border/40 px-3.5 py-2.5">
          {estimate.pricingKind === 'weight' && estimate.weight > 0 ? (
            <p className="mb-2 text-[11px] text-muted-foreground">
              Metal weight{' '}
              <span className="font-medium tabular-nums text-foreground/80">{estimate.weight}g</span>
            </p>
          ) : null}

          {showBreakdown ? (
            <ul className="mb-2 space-y-1.5">
              {priceLines.map((line) => (
                <li key={line.label} className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[11px] text-muted-foreground">{line.label}</span>
                    {line.detail ? (
                      <span className="mt-0.5 block truncate text-[10px] text-muted-foreground/75">
                        {line.detail}
                      </span>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-[11px] font-medium tabular-nums text-foreground/90">
                    {formatPrice(line.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div
            className={cn(
              'flex items-center justify-between gap-3',
              (showBreakdown || (estimate.pricingKind === 'weight' && estimate.weight > 0)) &&
                'border-t border-dashed border-border/50 pt-2'
            )}
          >
            <span className="text-[11px] font-medium text-foreground/80">
              Est. mounting
              <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground/80">
                incl. GST
              </span>
            </span>
            <span className="text-[12px] font-semibold tabular-nums text-foreground">
              {formatPrice(mountingDisplay)}
            </span>
          </div>
        </div>
      ) : (
        <div className="border-t border-border/40 px-3.5 py-2.5">
          <p className="text-[11px] text-muted-foreground">Select to view estimate</p>
        </div>
      )}
    </button>
  );
}

function SizeReadout({
  value,
  unit,
  active,
}: {
  value: string | null;
  unit: string;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        'flex min-w-[4.5rem] items-baseline justify-end gap-1 rounded-lg border px-2.5 py-1.5',
        active ? 'border-accent/35 bg-accent/[0.06]' : 'border-border/60 bg-white/80'
      )}
    >
      <span
        className={cn(
          'text-base font-semibold tabular-nums leading-none',
          active ? 'text-accent' : 'text-muted-foreground/50'
        )}
      >
        {value ?? '—'}
      </span>
      {value ? <span className="text-[10px] text-muted-foreground">{unit}</span> : null}
    </div>
  );
}

export default function MetalSizeSelector({
  settingType,
  metal,
  ringSize,
  goldRate,
  laborRates = null,
  pricingModes = null,
  ratesBySlug = null,
  selectedDesign,
  isCustomDesign = false,
  optionRules,
  onMetalChange,
  onRingSizeChange,
}: MetalSizeSelectorProps) {
  const [metals, setMetals] = useState<MetalOption[]>(FALLBACK_METALS);
  const [ringSizeSystem, setRingSizeSystem] = useState<RingSizeSystemId>(() =>
    parseRingSizeValue(ringSize).system
  );

  useEffect(() => {
    setRingSizeSystem(parseRingSizeValue(ringSize).system);
  }, [ringSize]);

  const parsedRingSize = useMemo(() => parseRingSizeValue(ringSize), [ringSize]);
  const allowedRingSizeSystems = useMemo(
    () => getAllowedRingSizeSystems(optionRules),
    [optionRules]
  );
  const visibleMetals = useMemo(
    () =>
      metals.filter((option) => {
        if (!isMetalAllowed(optionRules, option.id)) return false;
        if (!selectedDesign) return true;
        return isMetalAvailableForDesign(
          option.id,
          selectedDesign.making_charges,
          selectedDesign.estimated_metal_weight,
          selectedDesign.metal_flags
        );
      }),
    [metals, optionRules, selectedDesign]
  );
  const activeRingSizeSystem = useMemo(
    () => RING_SIZE_SYSTEMS.find((item) => item.id === ringSizeSystem) ?? RING_SIZE_SYSTEMS[0],
    [ringSizeSystem]
  );
  const stoneLabel = selectedDesign ? getStoneAddonLabelFromDesign(selectedDesign) : null;

  useEffect(() => {
    if (!allowedRingSizeSystems.includes(ringSizeSystem)) {
      const fallbackSystem = allowedRingSizeSystems[0] ?? 'indian';
      setRingSizeSystem(fallbackSystem);
      onRingSizeChange(null);
    }
  }, [allowedRingSizeSystems, onRingSizeChange, ringSizeSystem]);

  useEffect(() => {
    fetch('/api/metals')
      .then((r) => r.json())
      .then((data: Record<string, unknown>[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setMetals(data.map(apiToMetalOption));
        }
      })
      .catch(() => {});
  }, []);

  const ringSliderIndex = parsedRingSize.size
    ? Math.max(0, activeRingSizeSystem.sizes.findIndex((s) => s.value === parsedRingSize.size))
    : 0;

  return (
    <div className="pvg-metal-step space-y-6">
      {isCustomDesign ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-950">
          Preferred metal{settingType === 'ring' ? ' and ring size' : ''} only — mounting weight, labour, and final price are set after our team reviews your custom design.
          {settingType === 'pendant' ? ' Pendants are supplied without a chain.' : ''}
        </p>
      ) : null}

      {visibleMetals.length > 0 ? <MetalTrustMarquee /> : null}

      <fieldset>
        <SectionLabel className="mb-3">Select metal</SectionLabel>
        <div
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
          role="radiogroup"
          aria-label="Metal type"
        >
          {visibleMetals.map((opt) => (
            <MetalOptionCard
              key={opt.id}
              option={opt}
              isSelected={metal === opt.id}
              estimate={getEstimatedMetalPrice(
                opt.id,
                selectedDesign,
                goldRate,
                laborRates,
                pricingModes,
                ratesBySlug
              )}
              stoneLabel={stoneLabel}
              hasRates={Boolean(goldRate)}
              onSelect={() => onMetalChange(opt.id)}
            />
          ))}
        </div>
        {visibleMetals.length === 0 ? (
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            No metals are enabled for this product. Choose the loose stone option or contact us for a
            custom quote.
          </p>
        ) : null}
      </fieldset>

      {settingType === 'ring' ? (
        <fieldset className="rounded-xl border border-border/60 bg-[#faf8f5]/80 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <SectionLabel>Ring size</SectionLabel>
            <SizeReadout
              value={parsedRingSize.size}
              unit={activeRingSizeSystem.label}
              active={Boolean(parsedRingSize.size)}
            />
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {RING_SIZE_SYSTEMS.filter((system) =>
              allowedRingSizeSystems.includes(system.id)
            ).map((system) => (
              <button
                key={system.id}
                type="button"
                onClick={() => {
                  setRingSizeSystem(system.id);
                  onRingSizeChange(null);
                }}
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                  ringSizeSystem === system.id
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border/70 bg-white text-muted-foreground hover:border-accent/50'
                )}
              >
                {system.label}
              </button>
            ))}
          </div>

          <div className="px-0.5">
            <input
              type="range"
              min={0}
              max={activeRingSizeSystem.sizes.length - 1}
              value={ringSliderIndex}
              onChange={(e) => {
                const idx = Number(e.target.value);
                const sizeVal = activeRingSizeSystem.sizes[idx].value;
                onRingSizeChange(`${ringSizeSystem}:${sizeVal}`);
              }}
              className="pvg-range"
              style={{
                background: (() => {
                  const pct =
                    (ringSliderIndex / Math.max(1, activeRingSizeSystem.sizes.length - 1)) * 100;
                  return `linear-gradient(to right, #C9A84C 0%, #C9A84C ${pct}%, rgba(61,43,31,0.1) ${pct}%, rgba(61,43,31,0.1) 100%)`;
                })(),
              }}
              aria-label="Ring size"
            />
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground/70">
              <span>{activeRingSizeSystem.sizes[0].label}</span>
              <span>
                {activeRingSizeSystem.sizes[Math.floor(activeRingSizeSystem.sizes.length / 2)].label}
              </span>
              <span>
                {activeRingSizeSystem.sizes[activeRingSizeSystem.sizes.length - 1].label}
              </span>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            <a
              href="/tools/ring-size-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent underline underline-offset-2 hover:text-accent/80"
            >
              Ring size guide
            </a>
            {parsedRingSize.size ? (
              <span className="text-muted-foreground/80">
                {' '}
                · {activeRingSizeSystem.label} {parsedRingSize.size}
              </span>
            ) : null}
          </p>

          {!parsedRingSize.size ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-900" role="alert">
              Select a ring size to continue.
            </p>
          ) : null}
        </fieldset>
      ) : null}

      {settingType === 'bracelet' ? (
        <p className="rounded-xl border border-border/50 bg-[#faf8f5]/60 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
          Standard bracelet size. Our team will confirm exact sizing after you place the order.
        </p>
      ) : null}
    </div>
  );
}
