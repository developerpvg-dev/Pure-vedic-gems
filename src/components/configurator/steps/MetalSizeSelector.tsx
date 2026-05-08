'use client';

/**
 * Step 5 — Metal & Size Selection (Compact)
 * Inline metal pills, compact size grid. Less vertical space.
 */

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';
import {
  METAL_OPTIONS,
  CHAIN_LENGTHS,
} from '@/lib/types/configurator';
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

interface MetalSizeSelectorProps {
  settingType: SettingType;
  metal: MetalId | null;
  ringSize: string | null;
  chainLength: string | null;
  goldRate: GoldRateData | null;
  selectedDesign: JewelryDesign | null;
  optionRules: ConfiguratorOptionRules | null;
  onMetalChange: (metal: MetalId) => void;
  onRingSizeChange: (size: string | null) => void;
  onChainLengthChange: (length: string) => void;
}

const SLUG_TO_RATE_KEY: Record<string, keyof GoldRateData> = {
  gold_22k: 'gold_22k_per_gram',
  gold_18k: 'gold_18k_per_gram',
  silver_925: 'silver_per_gram',
  panchdhatu: 'panchdhatu_per_gram',
  platinum: 'platinum_per_gram',
};

function getRateForMetal(metalSlug: string, goldRate: GoldRateData): number {
  const key = SLUG_TO_RATE_KEY[metalSlug];
  if (key) return (goldRate[key] as number) ?? 0;
  return 0;
}

function getEstimatedMetalPrice(
  metalSlug: string,
  design: JewelryDesign | null,
  goldRate: GoldRateData | null
): { weight: number; rate: number; total: number } {
  if (!design || !goldRate) return { weight: 0, rate: 0, total: 0 };
  const weights = design.estimated_metal_weight as Record<string, number> | null;
  const weight = weights?.[metalSlug] ?? weights?.['default'] ?? 0;
  const rate = getRateForMetal(metalSlug, goldRate);
  return { weight, rate, total: Math.round(weight * rate) };
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

export default function MetalSizeSelector({
  settingType,
  metal,
  ringSize,
  chainLength,
  goldRate,
  selectedDesign,
  optionRules,
  onMetalChange,
  onRingSizeChange,
  onChainLengthChange,
}: MetalSizeSelectorProps) {
  const [metals, setMetals] = useState<MetalOption[]>(FALLBACK_METALS);
  const [ringSizeSystem, setRingSizeSystem] = useState<RingSizeSystemId>(() => parseRingSizeValue(ringSize).system);

  useEffect(() => {
    setRingSizeSystem(parseRingSizeValue(ringSize).system);
  }, [ringSize]);

  const parsedRingSize = useMemo(() => parseRingSizeValue(ringSize), [ringSize]);
  const allowedRingSizeSystems = useMemo(() => getAllowedRingSizeSystems(optionRules), [optionRules]);
  const visibleMetals = useMemo(
    () => metals.filter((option) => isMetalAllowed(optionRules, option.id)),
    [metals, optionRules]
  );
  const activeRingSizeSystem = useMemo(
    () => RING_SIZE_SYSTEMS.find((item) => item.id === ringSizeSystem) ?? RING_SIZE_SYSTEMS[0],
    [ringSizeSystem]
  );

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

  return (
    <div>
      {/* Metal selection — horizontal pills */}
      <fieldset className="mt-3">
        <legend className="text-xs font-medium text-primary mb-1.5">Select Metal</legend>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Metal type">
          {visibleMetals.map((opt) => {
            const isSelected = metal === opt.id;
            const estimate = getEstimatedMetalPrice(opt.id, selectedDesign, goldRate);

            return (
              <button
                key={opt.id}
                onClick={() => onMetalChange(opt.id)}
                role="radio"
                aria-checked={isSelected}
                className={cn(
                  'flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-all duration-150',
                  'hover:border-accent',
                  isSelected
                    ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                    : 'border-border bg-card'
                )}
              >
                <span className={cn('text-xs font-semibold', isSelected ? 'text-accent' : 'text-primary')}>
                  {opt.label}
                </span>
                {goldRate && (
                  <span className="text-[9px] text-muted-foreground">
                    {formatPrice(getRateForMetal(opt.id, goldRate))}/g
                    {estimate.total > 0 && ` · ≈${formatPrice(estimate.total)}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {visibleMetals.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            No metals are enabled for this product. Choose the loose stone option or contact us for a custom quote.
          </p>
        )}
      </fieldset>

      {/* Ring Size */}
      {settingType === 'ring' && (
        <fieldset className="mt-4">
          <legend className="sr-only">Ring Size</legend>

          {/* System switcher + live size display */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex gap-1">
              {RING_SIZE_SYSTEMS.filter((system) => allowedRingSizeSystems.includes(system.id)).map((system) => (
                <button
                  key={system.id}
                  onClick={() => { setRingSizeSystem(system.id); onRingSizeChange(null); }}
                  className={cn(
                    'rounded-lg border px-2.5 py-0.5 text-[10px] font-semibold transition-colors',
                    ringSizeSystem === system.id
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-border text-muted-foreground hover:border-accent/60'
                  )}
                >
                  {system.label}
                </button>
              ))}
            </div>

            <div className={cn(
              'flex items-baseline gap-1 rounded-xl border px-3 py-1.5 transition-colors',
              parsedRingSize.size
                ? 'border-accent/40 bg-accent/6'
                : 'border-border/50 bg-white/50'
            )}>
              <span className={cn(
                'text-xl font-bold leading-none font-heading',
                parsedRingSize.size ? 'text-accent' : 'text-muted-foreground/40'
              )}>
                {parsedRingSize.size ?? '—'}
              </span>
              <span className="text-[9px] text-muted-foreground">{activeRingSizeSystem.label}</span>
            </div>
          </div>

          {/* Gradient-filled range track */}
          <div className="px-1">
            <input
              type="range"
              min={0}
              max={activeRingSizeSystem.sizes.length - 1}
              value={
                parsedRingSize.size
                  ? Math.max(0, activeRingSizeSystem.sizes.findIndex((s) => s.value === parsedRingSize.size))
                  : 0
              }
              onChange={(e) => {
                const idx = Number(e.target.value);
                const sizeVal = activeRingSizeSystem.sizes[idx].value;
                onRingSizeChange(`${ringSizeSystem}:${sizeVal}`);
              }}
              className="pvg-range"
              style={{
                background: (() => {
                  const idx = parsedRingSize.size
                    ? Math.max(0, activeRingSizeSystem.sizes.findIndex((s) => s.value === parsedRingSize.size))
                    : 0;
                  const pct = (idx / Math.max(1, activeRingSizeSystem.sizes.length - 1)) * 100;
                  return `linear-gradient(to right, #C9A84C 0%, #C9A84C ${pct}%, rgba(61,43,31,0.12) ${pct}%, rgba(61,43,31,0.12) 100%)`;
                })(),
              }}
              aria-label="Ring size"
            />
            <div className="mt-1.5 flex justify-between text-[9px] text-muted-foreground/60">
              <span>{activeRingSizeSystem.sizes[0].label}</span>
              <span>{activeRingSizeSystem.sizes[Math.floor(activeRingSizeSystem.sizes.length / 2)].label}</span>
              <span>{activeRingSizeSystem.sizes[activeRingSizeSystem.sizes.length - 1].label}</span>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground">
            <a href="/tools/ring-size-guide" className="text-accent underline">Size guide</a>
            {parsedRingSize.size && (
              <> · Selected: {activeRingSizeSystem.label} {parsedRingSize.size}</>
            )}
          </p>
        </fieldset>
      )}

      {/* Chain Length */}
      {settingType === 'pendant' && (
        <fieldset className="mt-4">
          <legend className="sr-only">Chain Length</legend>

          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-primary">Chain Length</span>
            <div className={cn(
              'flex items-baseline gap-1 rounded-xl border px-3 py-1.5 transition-colors',
              chainLength
                ? 'border-accent/40 bg-accent/6'
                : 'border-border/50 bg-white/50'
            )}>
              <span className={cn(
                'text-xl font-bold leading-none font-heading',
                chainLength ? 'text-accent' : 'text-muted-foreground/40'
              )}>
                {chainLength ?? '—'}
              </span>
              {chainLength && <span className="text-[9px] text-muted-foreground">inches</span>}
            </div>
          </div>

          <div className="px-1">
            <input
              type="range"
              min={0}
              max={CHAIN_LENGTHS.length - 1}
              value={Math.max(0, CHAIN_LENGTHS.findIndex((l) => l.value === chainLength))}
              onChange={(e) => {
                const idx = Number(e.target.value);
                onChainLengthChange(CHAIN_LENGTHS[idx].value);
              }}
              className="pvg-range"
              style={{
                background: (() => {
                  const idx = Math.max(0, CHAIN_LENGTHS.findIndex((l) => l.value === chainLength));
                  const pct = (idx / Math.max(1, CHAIN_LENGTHS.length - 1)) * 100;
                  return `linear-gradient(to right, #C9A84C 0%, #C9A84C ${pct}%, rgba(61,43,31,0.12) ${pct}%, rgba(61,43,31,0.12) 100%)`;
                })(),
              }}
              aria-label="Chain length"
            />
            <div className="mt-1.5 flex justify-between">
              {CHAIN_LENGTHS.map((l) => (
                <span key={l.value} className="text-[9px] text-muted-foreground/60">{l.value}&quot;</span>
              ))}
            </div>
          </div>
        </fieldset>
      )}

      {settingType === 'bracelet' && (
        <p className="mt-3 text-xs text-muted-foreground">
          Standard bracelet size. Our team will confirm exact sizing.
        </p>
      )}
    </div>
  );
}
