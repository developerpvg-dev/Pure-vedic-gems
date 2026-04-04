'use client';

/**
 * PriceSummary — Itemized pricing sidebar (desktop) or bottom sheet (mobile).
 * Shows all cost components and total. "Add to Cart" button when complete.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice, formatEMI } from '@/lib/utils/format';
import { useCart } from '@/lib/hooks/useCart';
import { toast } from 'sonner';
import type { ConfiguratorState, GoldRateData } from '@/lib/types/configurator';

interface PriceSummaryProps {
  state: ConfiguratorState;
  isComplete: boolean;
  goldRate: GoldRateData | null;
  variant?: 'desktop' | 'mobile' | 'inline' | 'button-only';
}

export default function PriceSummary({
  state,
  isComplete,
  goldRate,
  variant = 'desktop',
}: PriceSummaryProps) {
  void goldRate;
  const { addItem } = useCart();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const p = state.pricing;

  const handleAddToCart = async () => {
    if (!state.selected_product || !isComplete) return;
    setAdding(true);

    try {
      // Server-side price verification
      const res = await fetch('/api/configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: state.selected_product.id,
          setting_type: state.setting_type,
          design_id: state.selected_design?.id ?? null,
          custom_design_url: state.custom_design_url,
          metal: state.metal,
          ring_size: state.ring_size,
          chain_length: state.chain_length,
          certification_id: state.selected_lab?.id ?? null,
          certification_skipped: state.certification_skipped,
          energization_id: state.selected_energization?.id ?? null,
          energization_form: state.energization_form,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save configuration');
      }

      const { configuration_id, verified_total } = await res.json();

      // Build human-readable summary
      const parts: string[] = [];
      parts.push(state.selected_product.name);
      if (state.setting_type && state.setting_type !== 'loose') {
        parts.push(state.setting_type.charAt(0).toUpperCase() + state.setting_type.slice(1));
      }
      if (state.metal) {
        parts.push(state.metal.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
      }
      if (state.selected_lab) parts.push(state.selected_lab.name);
      if (state.selected_energization) parts.push('Energized');

      addItem({
        product_id: state.selected_product.id,
        key: `${state.selected_product.id}_cfg_${configuration_id}`,
        sku: state.selected_product.slug ?? state.selected_product.id,
        name: state.selected_product.name,
        category: state.selected_product.category,
        image_url:
          state.selected_product.thumbnail_url ??
          ((state.selected_product.images as string[] | null)?.[0] ?? ''),
        price: verified_total,
        quantity: 1,
        carat_weight: state.selected_product.carat_weight,
        origin: state.selected_product.origin,
        configuration_id,
        configuration_summary: parts.join(' · '),
      });

      toast.success('Configuration added to cart!');
      router.push('/cart');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setAdding(false);
    }
  };

  // ── Mobile variant: compact bottom bar ─────────────────────────────────
  if (variant === 'mobile') {
    return (
      <div className="border-t border-border bg-card shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        {/* Expandable breakdown */}
        {expanded && (
          <div className="border-b border-border px-4 py-3 space-y-1 max-h-56 overflow-y-auto">
            <PriceLineItems pricing={p} settingType={state.setting_type} />
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            Details
          </button>

          <div className="flex-1 text-right">
            <p className="text-lg font-bold text-primary">
              {p.total > 0 ? formatPrice(p.total) : '—'}
            </p>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={!isComplete || adding}
            className="shrink-0 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
            size="sm"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
            Add to Cart
          </Button>
        </div>
      </div>
    );
  }

  // ── Inline variant: price line items only (used in modal expanded breakdown)
  if (variant === 'inline') {
    return (
      <div className="space-y-1.5">
        <PriceLineItems pricing={p} settingType={state.setting_type} />
        <div className="border-t border-dashed border-border pt-1.5 flex items-baseline justify-between">
          <span className="text-xs font-medium text-primary">Total</span>
          <span className="text-sm font-bold text-accent">
            {p.total > 0 ? formatPrice(p.total) : '—'}
          </span>
        </div>
      </div>
    );
  }

  // ── Button-only variant: just the Add to Cart button (used in modal footer on step 7)
  if (variant === 'button-only') {
    return (
      <Button
        onClick={handleAddToCart}
        disabled={!isComplete || adding}
        size="sm"
        className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
      >
        {adding ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ShoppingCart className="h-3.5 w-3.5" />
        )}
        Add to Cart
      </Button>
    );
  }

  // ── Desktop variant: simplified price summary ──────────────────────────
  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-border/70 shadow-[0_18px_42px_rgba(61,43,31,0.08)]"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(250,244,235,0.96) 100%)',
      }}
    >
      {/* Header — title + live total */}
      <div className="shrink-0 border-b border-border/60 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Price Summary
        </p>
        <p className="mt-2 text-xl font-bold text-primary">
          {p.total > 0 ? formatPrice(p.total) : '—'}
        </p>
        {p.total >= 10000 && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            or {formatEMI(p.total)}/mo × 12 EMI
          </p>
        )}
      </div>

      {/* Cost breakdown — flat list, no scroll */}
      <div className="flex-1 px-5 py-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Cost Breakdown
        </p>
        <div className="space-y-2.5">
          <PriceLineItems pricing={p} settingType={state.setting_type} />
        </div>

        {p.total > 0 && (
          <>
            <div className="border-t border-dashed border-border pt-2.5 flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-primary">Total</span>
              <span className="text-base font-bold text-accent">{formatPrice(p.total)}</span>
            </div>
          </>
        )}

        {p.total === 0 && (
          <p className="text-xs text-muted-foreground">
            Selections will update your quote instantly.
          </p>
        )}
      </div>

      {/* Footer — Add to Cart */}
      <div className="shrink-0 border-t border-border/60 px-5 py-4">
        <Button
          onClick={handleAddToCart}
          disabled={!isComplete || adding}
          className="h-11 w-full gap-1.5 rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          Add to Cart
        </Button>

        {!isComplete && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Complete all steps to add to cart.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Price line items sub-component ──────────────────────────────────────────

function PriceLineItems({
  pricing,
  settingType,
}: {
  pricing: ConfiguratorState['pricing'];
  settingType: string | null;
}) {
  const items = [
    { label: 'Gemstone', value: pricing.gem_price, show: true },
    {
      label: 'Making Charges',
      value: pricing.making_charge,
      show: settingType !== 'loose' && settingType !== null,
    },
    {
      label: `Metal (${pricing.metal_weight_grams}g)`,
      value: pricing.metal_price,
      show: settingType !== 'loose' && settingType !== null && pricing.metal_price > 0,
    },
    { label: 'Certification', value: pricing.certification_fee, show: true },
    { label: 'Energization', value: pricing.energization_fee, show: pricing.energization_fee > 0 },
  ];

  return (
    <>
      {items
        .filter((i) => i.show)
        .map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-xs font-medium text-foreground text-right">
              {item.value > 0 ? formatPrice(item.value) : item.label === 'Certification' ? 'Free' : '—'}
            </span>
          </div>
        ))}
    </>
  );
}
