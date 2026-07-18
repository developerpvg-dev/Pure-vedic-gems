import type { ConfigPricingBreakdown } from '@/lib/types/configurator';
import { gstOnAmount, resolveProductTax } from '@/lib/utils/tax';
import { formatPrice } from '@/lib/utils/format';

export interface ConfiguratorPriceLine {
  key: string;
  label: string;
  detail?: string;
  amount: number | null;
  display?: string;
}

export interface ConfiguratorPriceTotals {
  lines: ConfiguratorPriceLine[];
  jewelry_subtotal: number;
  pre_gst_subtotal: number;
  /** Metal @ 3% + making/diamond/custom @ 5% (matches server recalculateOrderTotal). */
  gst_jewelry: number;
  gst_metal: number;
  gst_making: number;
  gst_gemstone: number;
  gst_certification: number;
  gst_energization: number;
  gst_total: number;
  grand_total: number;
}

export function buildConfiguratorPriceTotals(
  pricing: ConfigPricingBreakdown,
  options: {
    settingType: string | null;
    productCategory?: string | null;
    /** @deprecated Ignored — server uses metal 3% / making 5%. Kept so old callers compile. */
    jewelryGstPercent?: number;
    designNote?: string | null;
  }
): ConfiguratorPriceTotals {
  const {
    settingType,
    productCategory,
    designNote = pricing.design_note,
  } = options;
  const showJewelry = Boolean(settingType && settingType !== 'loose');
  const lines: ConfiguratorPriceLine[] = [];

  lines.push({
    key: 'gem',
    label: productCategory === 'rudraksha' ? 'Rudraksha beads' : 'Gemstone',
    amount: pricing.gem_price,
    display: pricing.gem_price > 0 ? undefined : '—',
  });

  if (showJewelry) {
    const hasJewelryDetail =
      pricing.metal_price > 0 ||
      pricing.making_charge > 0 ||
      pricing.diamond_charge > 0 ||
      pricing.metal_weight_grams > 0;

    if (hasJewelryDetail) {
      if (pricing.jewelry_pricing_mode === 'weight' && pricing.metal_weight_grams > 0) {
        lines.push({
          key: 'metal-weight',
          label: 'Metal weight',
          display: `${pricing.metal_weight_grams} g`,
          amount: null,
        });
        if (pricing.gold_rate_per_gram > 0) {
          lines.push({
            key: 'metal-rate',
            label: 'Live metal rate',
            display: `${formatPrice(pricing.gold_rate_per_gram)}/g`,
            amount: null,
          });
        }
        if (pricing.metal_price > 0) {
          lines.push({
            key: 'metal-value',
            label: 'Metal value',
            detail:
              pricing.gold_rate_per_gram > 0
                ? `${pricing.metal_weight_grams} g × ${formatPrice(pricing.gold_rate_per_gram)}/g`
                : undefined,
            amount: pricing.metal_price,
          });
        }
        if (pricing.labor_rate_percent > 0 && pricing.making_charge > 0) {
          lines.push({
            key: 'labor',
            label: 'Labor charge',
            amount: pricing.making_charge,
          });
        } else if (pricing.making_charge > 0) {
          lines.push({
            key: 'making',
            label: 'Making charge',
            amount: pricing.making_charge,
          });
        }
      } else if (pricing.making_charge > 0) {
        lines.push({
          key: 'making-fixed',
          label: 'Making charge (fixed)',
          amount: pricing.making_charge,
        });
      }
    } else {
      lines.push({
        key: 'metal-value-pending',
        label: 'Metal value',
        amount: null,
        display: '—',
      });
      lines.push({
        key: 'making-pending',
        label: 'Making charge',
        amount: null,
        display: '—',
      });
    }

    if (pricing.diamond_charge > 0) {
      lines.push({
        key: 'stone-addon',
        label: pricing.stone_addon_label
          ? `${pricing.stone_addon_label} add-on`
          : 'Stone / diamond add-on',
        amount: pricing.diamond_charge,
      });
    }

    if (designNote) {
      lines.push({
        key: 'design-note',
        label: 'Design note',
        display: designNote,
        amount: null,
      });
    }
  }

  lines.push({
    key: 'cert',
    label: 'Certification',
    amount: pricing.certification_fee > 0 ? pricing.certification_fee : null,
    display: pricing.certification_fee > 0 ? undefined : 'Free',
  });

  if (pricing.energization_fee > 0) {
    lines.push({
      key: 'energization',
      label: 'Energization & puja',
      amount: pricing.energization_fee,
    });
  }

  if (pricing.custom_design_fee > 0) {
    lines.push({
      key: 'custom-design',
      label: 'Custom design review',
      amount: pricing.custom_design_fee,
    });
  }

  const jewelrySubtotal =
    pricing.metal_price + pricing.making_charge + pricing.diamond_charge;
  const makingTaxable =
    pricing.making_charge + pricing.diamond_charge + pricing.custom_design_fee;
  const preGstSubtotal =
    pricing.gem_price +
    jewelrySubtotal +
    pricing.certification_fee +
    pricing.energization_fee +
    pricing.custom_design_fee;

  // Mirror server calculateGstComponent rounding (2dp), then round total for display.
  const gstMetal = gstOnAmount(pricing.metal_price, 3);
  const gstMaking = gstOnAmount(makingTaxable, 5);
  const gstJewelry = gstMetal + gstMaking;

  const gemTax = resolveProductTax({ category: productCategory ?? 'gemstone' });
  const gstGemstone = gstOnAmount(pricing.gem_price, gemTax.rate_percent);
  const gstCertification = gstOnAmount(pricing.certification_fee, 18);
  const gstEnergization = gstOnAmount(pricing.energization_fee, 18);

  const gstTotal = Math.round(
    gstJewelry + gstGemstone + gstCertification + gstEnergization,
  );
  const grandTotal = preGstSubtotal + gstTotal;

  return {
    lines,
    jewelry_subtotal: jewelrySubtotal,
    pre_gst_subtotal: preGstSubtotal,
    gst_jewelry: gstJewelry,
    gst_metal: gstMetal,
    gst_making: gstMaking,
    gst_gemstone: gstGemstone,
    gst_certification: gstCertification,
    gst_energization: gstEnergization,
    gst_total: gstTotal,
    grand_total: grandTotal,
  };
}
