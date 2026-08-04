import type { ConfigPricingBreakdown } from '@/lib/types/configurator';
import {
  gstOnAmount,
  gstOnJewellery,
  isMetalMounted,
  jewelleryPriceInclGst,
  resolveGemOrBeadTaxRate,
} from '@/lib/utils/tax';

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
  /** Ex-GST merchandise (gem + jewellery + fees). */
  pre_gst_subtotal: number;
  /** 3% on (metal + labour + diamond + custom) when mounted/fixed. */
  gst_jewelry: number;
  /** @deprecated Prefer gst_jewelry — kept 0 when mounted for one-line GST. */
  gst_metal: number;
  /** @deprecated Prefer gst_jewelry */
  gst_making: number;
  /** Loose gem/bead GST (always 0 under current policy). */
  gst_gemstone: number;
  /** Rate shown on the gem/bead GST line (always 0). */
  gst_gem_rate_percent: number;
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
      // Display is tax-inclusive; gem never carries GST.
      const mountingEx = pricing.metal_price + pricing.making_charge;
      if (mountingEx > 0) {
        lines.push({
          key: 'est-mounting',
          label: 'Est. mounting',
          detail:
            pricing.jewelry_pricing_mode === 'weight' && pricing.metal_weight_grams > 0
              ? `${pricing.metal_weight_grams} g · incl. GST`
              : 'incl. GST',
          amount: jewelleryPriceInclGst(mountingEx),
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
        detail: 'incl. GST',
        amount: jewelleryPriceInclGst(pricing.diamond_charge),
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
      detail: 'incl. GST',
      amount: jewelleryPriceInclGst(pricing.custom_design_fee),
    });
  } else if (pricing.custom_design_pricing_pending && showJewelry) {
    // TBD line already added above when jewelry detail is empty
  }

  const jewelrySubtotal =
    pricing.metal_price + pricing.making_charge + pricing.diamond_charge;
  const preGstSubtotal =
    pricing.gem_price +
    jewelrySubtotal +
    pricing.certification_fee +
    pricing.energization_fee +
    pricing.custom_design_fee;

  const mounted = isMetalMounted({
    metal: pricing.metal_price,
    making: pricing.making_charge,
    diamond: pricing.diamond_charge,
    custom: pricing.custom_design_fee,
  });
  const gemRate = resolveGemOrBeadTaxRate(productCategory, mounted);

  // Jewellery only: 3% on (metal + labour + diamond + custom). Gem/bead never taxed.
  let gstJewelry = 0;
  let gstGemstone = 0;
  if (mounted) {
    gstJewelry = gstOnJewellery({
      metal: pricing.metal_price,
      making: pricing.making_charge,
      diamond: pricing.diamond_charge,
      custom: pricing.custom_design_fee,
    });
  } else {
    gstGemstone = gstOnAmount(pricing.gem_price, gemRate);
  }

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
    gst_metal: 0,
    gst_making: 0,
    gst_gemstone: gstGemstone,
    gst_gem_rate_percent: gemRate,
    gst_certification: gstCertification,
    gst_energization: gstEnergization,
    gst_total: gstTotal,
    grand_total: grandTotal,
  };
}
