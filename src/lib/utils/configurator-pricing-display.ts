import type { ConfigPricingBreakdown } from '@/lib/types/configurator';
import { GST_METAL_MOUNTED_PERCENT, gstOnAmount, resolveProductTax } from '@/lib/utils/tax';

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
  /** Metal + making/diamond/custom @ 3% (matches server recalculateOrderTotal). */
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
    /** @deprecated Ignored — server uses metal-mounted 3% for metal + making. Kept so old callers compile. */
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
    const customPending = pricing.custom_design_pricing_pending === true;
    const hasJewelryDetail =
      pricing.metal_price > 0 ||
      pricing.making_charge > 0 ||
      pricing.diamond_charge > 0 ||
      pricing.metal_weight_grams > 0;

    if (customPending && !hasJewelryDetail) {
      lines.push({
        key: 'custom-design-pending',
        label: 'Custom design mounting',
        detail: 'Priced after review — we will contact you',
        amount: null,
        display: 'TBD',
      });
    } else if (hasJewelryDetail) {
      // ponytail: hide metal/labor split — one Est. mounting line (charges still in amount)
      const mounting = pricing.metal_price + pricing.making_charge;
      if (mounting > 0) {
        lines.push({
          key: 'est-mounting',
          label: 'Est. mounting',
          detail:
            pricing.jewelry_pricing_mode === 'weight' && pricing.metal_weight_grams > 0
              ? `${pricing.metal_weight_grams} g`
              : undefined,
          amount: mounting,
        });
      }
    } else {
      lines.push({
        key: 'est-mounting-pending',
        label: 'Est. mounting',
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
  } else if (pricing.custom_design_pricing_pending && showJewelry) {
    // TBD line already added above when jewelry detail is empty
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
  const gstMetal = gstOnAmount(pricing.metal_price, GST_METAL_MOUNTED_PERCENT);
  const gstMaking = gstOnAmount(makingTaxable, GST_METAL_MOUNTED_PERCENT);
  const gstJewelry = gstMetal + gstMaking;

  const gemTax = resolveProductTax({ category: productCategory ?? 'gemstone' });
  const gstGemstone = gstOnAmount(pricing.gem_price, gemTax.rate_percent);
  // ponytail: cert + energization fees are GST-exempt (fee already final)
  const gstCertification = 0;
  const gstEnergization = 0;

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
