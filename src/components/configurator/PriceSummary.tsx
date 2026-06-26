'use client';

/**
 * PriceSummary — Itemized pricing sidebar (desktop) or bottom sheet (mobile).
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/format';
import { useCart } from '@/lib/hooks/useCart';
import { deriveCartLineKey } from '@/lib/cart/client';
import { toast } from 'sonner';
import { JEWELRY_GST_RATE_PERCENT } from '@/lib/constants/jewelry-design-metals';
import {
  buildConfiguratorPriceTotals,
  type ConfiguratorPriceLine,
} from '@/lib/utils/configurator-pricing-display';
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

  const totals = useMemo(
    () =>
      buildConfiguratorPriceTotals(p, {
        settingType: state.setting_type,
        productCategory: state.selected_product?.category ?? null,
        jewelryGstPercent: JEWELRY_GST_RATE_PERCENT,
      }),
    [p, state.setting_type, state.selected_product?.category]
  );

  const handleAddToCart = async () => {
    if (!state.selected_product || !isComplete) return;
    setAdding(true);

    try {
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

      const {
        configuration_id,
        verified_total,
        configuration_summary,
        configuration_snapshot,
        delivery_eta,
      } = await res.json();

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
        key: deriveCartLineKey({
          product_id: state.selected_product.id,
          configuration_id,
        }),
        sku: state.selected_product.sku ?? state.selected_product.id,
        tag_number: state.selected_product.tag_number ?? null,
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
        configuration_summary: configuration_summary ?? parts.join(' · '),
        configuration_snapshot,
        configuration_edit_url: `/configure/${state.selected_product.id}`,
        delivery_eta_label: delivery_eta?.label,
      });

      toast.success('Configuration added to cart!');
      router.push('/cart');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setAdding(false);
    }
  };

  const addToCartButton = (
    <Button
      onClick={handleAddToCart}
      disabled={!isComplete || adding}
      className="h-12 w-full gap-2 rounded-2xl text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
    >
      {adding ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <ShoppingCart className="h-5 w-5" />
      )}
      Add to Cart
    </Button>
  );

  if (variant === 'mobile') {
    return (
      <div className="border-t border-border bg-card shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        {expanded && (
          <div className="max-h-64 overflow-y-auto border-b border-border px-4 py-4">
            <DetailedPriceLines totals={totals} size="large" />
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            Details
          </button>

          <div className="flex-1 text-right">
            <p className="text-xl font-bold text-primary">
              {totals.grand_total > 0 ? formatPrice(totals.grand_total) : '—'}
            </p>
            {totals.gst_total > 0 && (
              <p className="text-xs text-muted-foreground">incl. GST</p>
            )}
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={!isComplete || adding}
            className="shrink-0 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
            Add to Cart
          </Button>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="space-y-3">
        <DetailedPriceLines totals={totals} size="large" />
      </div>
    );
  }

  if (variant === 'button-only') {
    return (
      <Button
        onClick={handleAddToCart}
        disabled={!isComplete || adding}
        className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold"
      >
        {adding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        Add to Cart
      </Button>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-border/70 shadow-[0_18px_42px_rgba(61,43,31,0.08)]"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(250,244,235,0.96) 100%)',
      }}
    >
      <div className="shrink-0 border-b border-border/60 px-6 py-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          Price Summary
        </p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-primary">
          {totals.grand_total > 0 ? formatPrice(totals.grand_total) : '—'}
        </p>
        {totals.gst_total > 0 && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            Includes {formatPrice(totals.gst_total)} GST
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Cost Breakdown
        </p>
        {totals.grand_total > 0 ? (
          <DetailedPriceLines totals={totals} size="large" />
        ) : (
          <p className="text-sm text-muted-foreground">
            Selections will update your quote instantly.
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-border/60 bg-white/50 px-6 py-5">
        {addToCartButton}
        {!isComplete && (
          <p className="mt-2.5 text-center text-xs text-muted-foreground">
            Complete all required steps to add to cart.
          </p>
        )}
      </div>
    </div>
  );
}

function DetailedPriceLines({
  totals,
  size = 'default',
}: {
  totals: ReturnType<typeof buildConfiguratorPriceTotals>;
  size?: 'default' | 'large';
}) {
  const large = size === 'large';

  return (
    <div className={large ? 'space-y-4 text-sm' : 'space-y-3 text-xs'}>
      <div className={large ? 'space-y-3' : 'space-y-2'}>
        {totals.lines.map((line) => (
          <PriceLine key={line.key} line={line} large={large} />
        ))}
      </div>

      {totals.pre_gst_subtotal > 0 && (
        <div
          className={`flex items-center justify-between gap-3 border-t border-dashed border-border pt-3 font-semibold text-foreground ${
            large ? 'text-sm' : ''
          }`}
        >
          <span>Subtotal (ex-GST)</span>
          <span>{formatPrice(totals.pre_gst_subtotal)}</span>
        </div>
      )}

      {totals.gst_jewelry > 0 && (
        <PriceLine
          large={large}
          line={{
            key: 'gst-jewelry',
            label: `GST on jewellery (${JEWELRY_GST_RATE_PERCENT}%)`,
            amount: totals.gst_jewelry,
          }}
        />
      )}
      {totals.gst_gemstone > 0 && (
        <PriceLine
          large={large}
          line={{
            key: 'gst-gem',
            label: 'GST on gemstone (0.25%)',
            amount: totals.gst_gemstone,
          }}
        />
      )}
      {totals.gst_certification > 0 && (
        <PriceLine
          large={large}
          line={{
            key: 'gst-cert',
            label: 'GST on certification (18%)',
            amount: totals.gst_certification,
          }}
        />
      )}
      {totals.gst_energization > 0 && (
        <PriceLine
          large={large}
          line={{
            key: 'gst-energ',
            label: 'GST on energization (18%)',
            amount: totals.gst_energization,
          }}
        />
      )}

      {totals.gst_total > 0 && (
        <div
          className={`flex items-center justify-between gap-3 border-t border-border/60 pt-3 font-semibold text-foreground ${
            large ? 'text-sm' : ''
          }`}
        >
          <span>Total GST</span>
          <span>{formatPrice(totals.gst_total)}</span>
        </div>
      )}

      <div
        className={`flex items-center justify-between gap-3 rounded-xl bg-accent/8 px-3 py-3 ${
          large ? 'mt-1' : ''
        }`}
      >
        <span className={large ? 'text-base font-semibold text-primary' : 'text-sm font-semibold text-primary'}>
          Grand total
        </span>
        <span className={large ? 'text-xl font-bold text-accent' : 'text-base font-bold text-accent'}>
          {formatPrice(totals.grand_total)}
        </span>
      </div>
    </div>
  );
}

function PriceLine({ line, large = false }: { line: ConfiguratorPriceLine; large?: boolean }) {
  const value =
    line.display ??
    (line.amount != null && line.amount > 0 ? formatPrice(line.amount) : 'Free');

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className={large ? 'text-sm font-medium text-foreground/85' : 'text-muted-foreground'}>
          {line.label}
        </p>
        {line.detail && (
          <p
            className={
              large
                ? 'mt-1 text-xs leading-relaxed text-muted-foreground'
                : 'mt-0.5 text-[10px] leading-snug text-muted-foreground/80'
            }
          >
            {line.detail}
          </p>
        )}
      </div>
      <span
        className={`shrink-0 text-right font-semibold text-foreground ${
          large ? 'text-sm' : 'font-medium'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
