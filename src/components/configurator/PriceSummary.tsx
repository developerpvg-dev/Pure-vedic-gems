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
import {
  buildConfiguratorPriceTotals,
  type ConfiguratorPriceLine,
} from '@/lib/utils/configurator-pricing-display';
import { resolveProductTax } from '@/lib/utils/tax';
import type { ConfiguratorState, GoldRateData } from '@/lib/types/configurator';
import { isDesignCompatibleWithSetting } from '@/lib/hooks/useConfigurator';

interface PriceSummaryProps {
  state: ConfiguratorState;
  isComplete: boolean;
  goldRate: GoldRateData | null;
  variant?: 'desktop' | 'mobile' | 'inline' | 'button-only';
  onDesignMismatch?: () => void;
}

function enrichPriceTotals(
  state: ConfiguratorState,
  totals: ReturnType<typeof buildConfiguratorPriceTotals>,
) {
  const product = state.selected_product;
  if (!product) return totals;

  const comboNames = state.rudraksha_combo_products
    .filter((item) => item.id !== product.id)
    .map((item) => item.name);

  const beadDetail =
    comboNames.length > 0
      ? [product.name, ...comboNames].join(' + ')
      : product.name;

  return {
    ...totals,
    lines: totals.lines.map((line) => {
      if (line.key !== 'gem') return line;
      return {
        ...line,
        detail: beadDetail,
      };
    }),
  };
}

export default function PriceSummary({
  state,
  isComplete,
  goldRate,
  variant = 'desktop',
  onDesignMismatch,
}: PriceSummaryProps) {
  void goldRate;
  const { addItem } = useCart();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const p = state.pricing;

  const totals = useMemo(() => {
    const base = buildConfiguratorPriceTotals(p, {
      settingType: state.setting_type,
      productCategory: state.selected_product?.category ?? null,
    });
    return enrichPriceTotals(state, base);
  }, [p, state]);

  const handleAddToCart = async () => {
    if (!state.selected_product || !isComplete) return;

    if (state.selected_design && !isDesignCompatibleWithSetting(state)) {
      toast.error('Please re-select a design for your chosen setting.', {
        description: 'Your saved design does not match the current ring, pendant, or bracelet.',
      });
      onDesignMismatch?.();
      return;
    }

    if (
      state.selected_energization &&
      (
        !state.energization_form?.dob ||
        !state.energization_form.birth_time ||
        !state.energization_form.birth_place ||
        !state.energization_form.gotra
      )
    ) {
      toast.error('Please complete the Vedic birth details for energization.');
      return;
    }

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
          custom_design_brief: state.custom_design_brief,
          rudraksha_combo_product_ids: state.rudraksha_combo_products.map((item) => item.id),
          metal: state.metal,
          ring_size: state.ring_size,
          chain_length: state.chain_length,
          certification_id: state.selected_lab?.id ?? null,
          certification_skipped: state.certification_skipped,
          energization_id: state.selected_energization?.id ?? null,
          energization_form: state.energization_form,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = typeof payload.error === 'string' ? payload.error : 'Failed to save configuration';
        if (message.toLowerCase().includes('design')) {
          onDesignMismatch?.();
        }
        throw new Error(message);
      }

      const {
        configuration_id,
        verified_total,
        configuration_summary,
        configuration_snapshot,
        delivery_eta,
      } = payload;

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
        configuration_edit_url:
          state.rudraksha_combo_products.length > 0
            ? `/configure/${state.selected_product.id}?combo=${[
                state.selected_product.id,
                ...state.rudraksha_combo_products.map((item) => item.id),
              ].join(',')}`
            : `/configure/${state.selected_product.id}`,
        delivery_eta_label: delivery_eta?.label,
      });

      toast.success('Added to cart', {
        description:
          state.custom_design_url && state.custom_design_brief
            ? 'Our design team will contact you soon to discuss your custom design.'
            : state.selected_product.name,
      });

      window.requestAnimationFrame(() => {
        router.push('/cart');
      });
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
      className="h-10 w-full gap-2 rounded-xl text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
    >
      {adding ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="h-4 w-4" />
      )}
      Add to Cart
    </Button>
  );

  if (variant === 'mobile') {
    return (
      <div className="pvg-price-summary border-t border-border bg-card shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        {expanded && (
          <div className="max-h-64 overflow-y-auto border-b border-border px-4 py-3">
            <DetailedPriceLines
              totals={totals}
              productCategory={state.selected_product?.category}
              showFooterTotal
            />
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            Details
          </button>

          <div className="flex-1 text-right">
            <p className="text-base font-semibold tabular-nums text-foreground">
              {totals.grand_total > 0 ? formatPrice(totals.grand_total) : '—'}
            </p>
            {totals.gst_total > 0 && (
              <p className="text-[10px] text-muted-foreground">incl. GST</p>
            )}
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={!isComplete || adding}
            className="shrink-0 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
          >
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
            Add to Cart
          </Button>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="pvg-price-summary space-y-3">
        <DetailedPriceLines
          totals={totals}
          productCategory={state.selected_product?.category}
          showFooterTotal
        />
      </div>
    );
  }

  if (variant === 'button-only') {
    return (
      <Button
        onClick={handleAddToCart}
        disabled={!isComplete || adding}
        className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-medium"
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
    <div className="pvg-price-summary flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-white">
      <div className="shrink-0 border-b border-border/50 px-4 py-3.5">
        <p className="text-[11px] font-medium text-muted-foreground">Price summary</p>
        <p className="pvg-price-summary-total mt-1 text-lg font-semibold tabular-nums text-foreground">
          {totals.grand_total > 0 ? formatPrice(totals.grand_total) : '—'}
        </p>
        {totals.gst_total > 0 ? (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Includes {formatPrice(totals.gst_total)} GST
          </p>
        ) : (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Updates as you complete each step
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5">
        <p className="mb-2.5 text-[11px] font-medium text-muted-foreground">Cost breakdown</p>
        <DetailedPriceLines
          totals={totals}
          productCategory={state.selected_product?.category}
        />
      </div>

      <div className="shrink-0 border-t border-border/50 px-4 py-3.5">
        {addToCartButton}
        {!isComplete && (
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Complete all required steps to add to cart.
          </p>
        )}
      </div>
    </div>
  );
}

function DetailedPriceLines({
  totals,
  productCategory,
  showFooterTotal = false,
}: {
  totals: ReturnType<typeof buildConfiguratorPriceTotals>;
  productCategory?: string | null;
  showFooterTotal?: boolean;
}) {
  const gemRate = resolveProductTax({ category: productCategory ?? 'gemstone' }).rate_percent;

  return (
    <div className="space-y-2.5 text-xs text-foreground/90">
      <div className="space-y-2">
        {totals.lines.map((line) => (
          <PriceLine key={line.key} line={line} />
        ))}
      </div>

      {totals.pre_gst_subtotal > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-dashed border-border/70 pt-2.5 text-[11px] font-medium text-foreground">
          <span>Subtotal (ex-GST)</span>
          <span className="tabular-nums">{formatPrice(totals.pre_gst_subtotal)}</span>
        </div>
      )}

      {totals.gst_metal > 0 && (
        <PriceLine
          line={{
            key: 'gst-metal',
            label: 'GST on metal (3%)',
            amount: totals.gst_metal,
          }}
        />
      )}
      {totals.gst_making > 0 && (
        <PriceLine
          line={{
            key: 'gst-making',
            label: 'GST on making / stone add-on (5%)',
            amount: totals.gst_making,
          }}
        />
      )}
      {totals.gst_gemstone > 0 && (
        <PriceLine
          line={{
            key: 'gst-gem',
            label: `GST on gemstone (${gemRate}%)`,
            amount: totals.gst_gemstone,
          }}
        />
      )}
      {totals.gst_certification > 0 && (
        <PriceLine
          line={{
            key: 'gst-cert',
            label: 'GST on certification (18%)',
            amount: totals.gst_certification,
          }}
        />
      )}
      {totals.gst_energization > 0 && (
        <PriceLine
          line={{
            key: 'gst-energ',
            label: 'GST on energization (18%)',
            amount: totals.gst_energization,
          }}
        />
      )}

      {totals.gst_total > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-2.5 text-[11px] font-medium text-foreground">
          <span>Total GST</span>
          <span className="tabular-nums">{formatPrice(totals.gst_total)}</span>
        </div>
      )}

      {showFooterTotal && (
        <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-2.5">
          <span className="text-xs font-medium text-foreground">Grand total</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {totals.grand_total > 0 ? formatPrice(totals.grand_total) : '—'}
          </span>
        </div>
      )}
    </div>
  );
}

function PriceLine({ line }: { line: ConfiguratorPriceLine }) {
  const value =
    line.display ??
    (line.amount != null && line.amount > 0 ? formatPrice(line.amount) : '—');

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] leading-snug text-muted-foreground">{line.label}</p>
        {line.detail && (
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground/80">{line.detail}</p>
        )}
      </div>
      <span className="shrink-0 text-right text-[11px] font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
