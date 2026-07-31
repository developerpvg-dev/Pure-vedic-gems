import type { CartItem } from '@/lib/types/cart';
import type { ConfigPricingBreakdown } from '@/lib/types/configurator';
import { parseConfigurationSnapshot } from '@/lib/utils/configuration-snapshot';
import {
  buildConfiguratorPriceTotals,
  type ConfiguratorPriceLine,
} from '@/lib/utils/configurator-pricing-display';
import { resolveProductTax } from '@/lib/utils/tax';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';

function snapshotToPricing(pricing: NonNullable<ReturnType<typeof parseConfigurationSnapshot>>['pricing']): ConfigPricingBreakdown {
  return {
    gem_price: Number(pricing?.gem_price ?? 0),
    making_charge: Number(pricing?.making_charge ?? 0),
    diamond_charge: Number(pricing?.diamond_charge ?? 0),
    stone_addon_label: pricing?.stone_addon_label ?? null,
    design_note: pricing?.design_note ?? null,
    metal_price: Number(pricing?.metal_price ?? 0),
    metal_weight_grams: Number(pricing?.metal_weight_grams ?? 0),
    gold_rate_per_gram: Number(pricing?.gold_rate_per_gram ?? 0),
    labor_rate_percent: Number(pricing?.labor_rate_percent ?? 0),
    jewelry_pricing_mode:
      pricing?.jewelry_pricing_mode === 'weight' || pricing?.jewelry_pricing_mode === 'fixed'
        ? pricing.jewelry_pricing_mode
        : null,
    certification_fee: Number(pricing?.certification_fee ?? 0),
    energization_fee: Number(pricing?.energization_fee ?? 0),
    custom_design_fee: Number(pricing?.custom_design_fee ?? 0),
    custom_design_pricing_pending: pricing?.custom_design_pricing_pending === true,
    total: Number(pricing?.total ?? 0),
  };
}

export type CartPriceBreakdown = {
  lines: ConfiguratorPriceLine[];
  preGstSubtotal: number;
  estimatedGst: number;
  gstLines: ConfiguratorPriceLine[];
  /** Unit price stored on the cart line (ex-GST components for configured items). */
  unitPrice: number;
};

/** Build a clear charge list for one cart line (configured or plain product). */
export function buildCartItemPriceBreakdown(item: CartItem): CartPriceBreakdown {
  const snap = parseConfigurationSnapshot(item.configuration_snapshot);
  const unitPrice = item.price;

  if (snap?.pricing && (snap.pricing.gem_price != null || snap.pricing.total != null || snap.pricing.making_charge != null)) {
    const pricing = snapshotToPricing(snap.pricing);
    const settingType = snap.selections?.setting_type ?? null;
    const totals = buildConfiguratorPriceTotals(pricing, {
      settingType,
      productCategory: snap.product?.category ?? item.category,
      designNote: pricing.design_note,
    });

    const gstLines: ConfiguratorPriceLine[] = [];
    const gemTax = resolveProductTax({
      category: snap.product?.category ?? item.category,
    });
    if (totals.gst_gemstone > 0) {
      gstLines.push({
        key: 'gst-gem',
        label: `Est. GST on gemstone (${gemTax.rate_percent}%)`,
        amount: totals.gst_gemstone,
      });
    }
    if (totals.gst_metal > 0) {
      gstLines.push({ key: 'gst-metal', label: 'Est. GST on metal (3%)', amount: totals.gst_metal });
    }
    if (totals.gst_making > 0) {
      gstLines.push({
        key: 'gst-making',
        label: 'Est. GST on making / stone add-on (5%)',
        amount: totals.gst_making,
      });
    }
    if (totals.gst_certification > 0) {
      gstLines.push({ key: 'gst-cert', label: 'Est. GST on certification (18%)', amount: totals.gst_certification });
    }
    if (totals.gst_energization > 0) {
      gstLines.push({ key: 'gst-energization', label: 'Est. GST on energization (18%)', amount: totals.gst_energization });
    }

    return {
      lines: totals.lines,
      preGstSubtotal: totals.pre_gst_subtotal > 0 ? totals.pre_gst_subtotal : unitPrice,
      estimatedGst: totals.gst_total,
      gstLines,
      unitPrice,
    };
  }

  const tax = resolveProductTax({ category: item.category });
  const estimatedGst =
    unitPrice > 0 && tax.rate_percent > 0
      ? Math.round((unitPrice * tax.rate_percent) / 100)
      : 0;

  const lines: ConfiguratorPriceLine[] = [
    {
      key: 'product',
      label: item.category === 'rudraksha' ? 'Rudraksha' : 'Product price',
      detail: formatProductDisplayName(item.name),
      amount: unitPrice,
    },
  ];

  const gstLines: ConfiguratorPriceLine[] =
    estimatedGst > 0
      ? [
          {
            key: 'gst-product',
            label: `Est. GST (${tax.rate_percent}%)`,
            amount: estimatedGst,
          },
        ]
      : [];

  return {
    lines,
    preGstSubtotal: unitPrice,
    estimatedGst,
    gstLines,
    unitPrice,
  };
}
