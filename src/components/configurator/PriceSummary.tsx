'use client';

/**
 * PriceSummary — Itemized pricing sidebar (desktop) or bottom sheet (mobile).
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/format';
import { useCurrencySubscription } from '@/lib/hooks/useCurrency';
import { useCart } from '@/lib/hooks/useCart';
import { deriveCartLineKey } from '@/lib/cart/client';
import { toast } from 'sonner';
import {
  buildConfiguratorPriceTotals,
  type ConfiguratorPriceLine,
} from '@/lib/utils/configurator-pricing-display';
import type { ConfiguratorState, GoldRateData } from '@/lib/types/configurator';
import { isDesignCompatibleWithSetting } from '@/lib/hooks/useConfigurator';

export type ConfiguredOrderResult = {
  configuration_id: string;
  verified_total: number;
  configuration_summary: string | null;
  configuration_snapshot: unknown;
  delivery_eta: { label?: string } | null;
  product: NonNullable<ConfiguratorState['selected_product']>;
  design_id: string | null;
  design_name: string | null;
};

interface PriceSummaryProps {
  state: ConfiguratorState;
  isComplete: boolean;
  goldRate: GoldRateData | null;
  variant?: 'desktop' | 'mobile' | 'inline' | 'button-only';
  onDesignMismatch?: () => void;
  /** When set, skip cart redirect and return saved config to the caller (admin POS). */
  onConfigured?: (result: ConfiguredOrderResult) => void;
  submitLabel?: string;
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
  onConfigured,
  submitLabel,
}: PriceSummaryProps) {
  useCurrencySubscription();
  void goldRate;
  const { addItem, getCartItem } = useCart();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const p = state.pricing;
  const alreadyConfigured = Boolean(
    state.selected_product && getCartItem(state.selected_product.id)?.configuration_id
  );
  const ctaLabel =
    submitLabel ??
    (onConfigured ? 'Add to order' : alreadyConfigured ? 'Update Cart' : 'Add to Cart');

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

      const summary = configuration_summary ?? parts.join(' · ');

      if (onConfigured) {
        onConfigured({
          configuration_id,
          verified_total,
          configuration_summary: summary,
          configuration_snapshot,
          delivery_eta: delivery_eta ?? null,
          product: state.selected_product,
          design_id: state.selected_design?.id ?? null,
          design_name: state.selected_design?.name ?? null,
        });
        toast.success('Added to order', {
          description: state.selected_product.name,
        });
        return;
      }

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
        configuration_summary: summary,
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

      toast.success(alreadyConfigured ? 'Cart updated' : 'Added to cart', {
        description:
          state.custom_design_url && state.custom_design_brief
            ? 'We will contact you soon with custom design mounting pricing. You can pay for the gem and selected services now.'
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
      {ctaLabel}
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
            {ctaLabel}
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
        {ctaLabel}
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
          <p className="mt-0.5 text-[10px] text-muted-foreground">incl. GST on jewellery</p>
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
  productCategory: _productCategory,
  showFooterTotal = false,
}: {
  totals: ReturnType<typeof buildConfiguratorPriceTotals>;
  productCategory?: string | null;
  showFooterTotal?: boolean;
}) {
  void _productCategory;

  return (
    <div className="space-y-2.5 text-xs text-foreground/90">
      <div className="space-y-2">
        {totals.lines.map((line) => (
          <PriceLine key={line.key} line={line} />
        ))}
      </div>

      {showFooterTotal && (
        <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-2.5">
          <div>
            <span className="text-xs font-medium text-foreground">Grand total</span>
            {totals.gst_total > 0 ? (
              <p className="mt-0.5 text-[10px] text-muted-foreground">incl. GST on jewellery</p>
            ) : null}
          </div>
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
