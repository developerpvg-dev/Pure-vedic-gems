import type { ConfigPricingBreakdown } from '@/lib/types/configurator';
import {
  gstOnAmount,
  gstOnJewellery,
  isMetalMounted,
  resolveGemOrBeadTaxRate,
  resolveJewelryPricingMode,
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
  /** Ex-tax merchandise (gem + jewellery + fees). */
  pre_gst_subtotal: number;
  /** Internal: 3% on weight+labour jewellery (never shown as a customer line). */
  gst_jewelry: number;
  /** @deprecated Prefer gst_jewelry */
  gst_metal: number;
  /** @deprecated Prefer gst_jewelry */
  gst_making: number;
  gst_gemstone: number;
  gst_gem_rate_percent: number;
  gst_certification: number;
  gst_energization: number;
  gst_total: number;
  /** Customer grand total including any weight jewellery tax (no separate GST row). */
  grand_total: number;
}

/**
 * Customer price lines never mention GST.
 * Weight + labour: 3% is baked once into the primary jewellery line + grand_total.
 * Fixed sheet: amounts as entered.
 */
export function buildConfiguratorPriceTotals(
  pricing: ConfigPricingBreakdown,
  options: {
    settingType: string | null;
    productCategory?: string | null;
    /** @deprecated Ignored */
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
  const mode = resolveJewelryPricingMode(pricing);
  const lines: ConfiguratorPriceLine[] = [];

  const mountingEx = pricing.metal_price + pricing.making_charge;
  const diamondEx = pricing.diamond_charge;
  const customEx = pricing.custom_design_fee;

  const jewelryGst = Math.round(
    gstOnJewellery(
      {
        metal: pricing.metal_price,
        making: pricing.making_charge,
        diamond: pricing.diamond_charge,
        custom: pricing.custom_design_fee,
      },
      mode,
    ),
  );

  // Bake full jewellery tax once onto one line so line amounts still sum to grand_total.
  let mountingAmt = mountingEx;
  let diamondAmt = diamondEx;
  let customAmt = customEx;
  if (jewelryGst > 0) {
    if (mountingEx > 0) mountingAmt = mountingEx + jewelryGst;
    else if (diamondEx > 0) diamondAmt = diamondEx + jewelryGst;
    else if (customEx > 0) customAmt = customEx + jewelryGst;
  }

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
      if (mountingEx > 0) {
        lines.push({
          key: 'est-mounting',
          label: 'Est. mounting',
          detail:
            mode === 'weight' && pricing.metal_weight_grams > 0
              ? `${pricing.metal_weight_grams} g`
              : undefined,
          amount: mountingAmt,
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

    if (diamondEx > 0) {
      lines.push({
        key: 'stone-addon',
        label: pricing.stone_addon_label
          ? `${pricing.stone_addon_label} add-on`
          : 'Stone / diamond add-on',
        amount: diamondAmt,
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

  if (customEx > 0) {
    lines.push({
      key: 'custom-design',
      label: 'Custom design review',
      amount: customAmt,
    });
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

  let gstJewelry = jewelryGst;
  let gstGemstone = 0;
  if (!mounted) {
    gstJewelry = 0;
    gstGemstone = Math.round(gstOnAmount(pricing.gem_price, gemRate));
  }

  const gstTotal = gstJewelry + gstGemstone;
  // ponytail: no customer "GST" line — tax is inside jewellery line amounts + grand_total
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
    gst_certification: 0,
    gst_energization: 0,
    gst_total: gstTotal,
    grand_total: grandTotal,
  };
}
