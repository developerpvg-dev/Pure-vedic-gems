/**
 * Admin sets metal / weight / labor (or fixed making) on a custom-design order line.
 * Reuses metal-weight money folding for amount_due / payment_status.
 */

import {
  parseConfigurationSnapshot,
  type ConfigurationSnapshot,
} from '@/lib/utils/configuration-snapshot';
import { GST_METAL_MOUNTED_PERCENT, gstOnAmount } from '@/lib/utils/tax';
import {
  applyMetalDeltaToOrderMoney,
  type OrderMoneyAfterMetalAdjust,
} from '@/lib/orders/metal-weight-adjust';
import { roundMoney } from '@/lib/orders/counter-payments';

export type CustomDesignPriceMode = 'weight' | 'fixed';

export type CustomDesignPriceInput = {
  metal?: string | null;
  mode: CustomDesignPriceMode;
  /** Required for weight mode */
  metal_weight_grams?: number;
  gold_rate_per_gram?: number;
  labor_rate_percent?: number;
  /** Required for fixed mode (making only; metal may still be set) */
  making_charge?: number;
  metal_price?: number;
  diamond_charge?: number;
  custom_design_fee?: number;
};

export type CustomDesignPriceAdjustResult = {
  metalDelta: number;
  makingDelta: number;
  diamondDelta: number;
  customFeeDelta: number;
  gstDelta: number;
  totalDelta: number;
  nextPricing: NonNullable<ConfigurationSnapshot['pricing']>;
  nextSelections: NonNullable<ConfigurationSnapshot['selections']>;
};

function roundGrams(n: number) {
  return Math.round(n * 1000) / 1000;
}

export function applyCustomDesignPriceToPricing(
  snapshot: unknown,
  input: CustomDesignPriceInput,
): CustomDesignPriceAdjustResult {
  const parsed = parseConfigurationSnapshot(snapshot);
  if (!parsed?.pricing) throw new Error('This item has no configuration pricing to adjust.');
  if (!parsed.selections?.custom_design_url) {
    throw new Error('This line is not a custom design request.');
  }

  const pricing = parsed.pricing;
  const oldMetal = Math.round(Number(pricing.metal_price ?? 0));
  const oldMaking = Math.round(Number(pricing.making_charge ?? 0));
  const oldDiamond = Math.round(Number(pricing.diamond_charge ?? 0));
  const oldFee = Math.round(Number(pricing.custom_design_fee ?? 0));

  let newMetal = oldMetal;
  let newMaking = oldMaking;
  let newWeight = Number(pricing.metal_weight_grams ?? 0);
  let newRate = Number(pricing.gold_rate_per_gram ?? 0);
  let newLaborPct = Number(pricing.labor_rate_percent ?? 0);
  let mode: 'weight' | 'fixed' = input.mode;

  if (input.mode === 'weight') {
    const weight = roundGrams(Number(input.metal_weight_grams ?? 0));
    const rate = Number(input.gold_rate_per_gram ?? 0);
    const laborPct = Number(input.labor_rate_percent ?? 0);
    if (!(weight > 0)) throw new Error('Enter a metal weight greater than zero.');
    if (!(rate > 0)) throw new Error('Enter a metal rate per gram.');
    newWeight = weight;
    newRate = rate;
    newLaborPct = laborPct;
    newMetal = Math.round(weight * rate);
    newMaking = laborPct > 0 ? Math.round((newMetal * laborPct) / 100) : Math.round(Number(input.making_charge ?? 0));
  } else {
    newMaking = Math.round(Number(input.making_charge ?? 0));
    newMetal = Math.round(Number(input.metal_price ?? 0));
    if (!(newMaking > 0) && !(newMetal > 0)) {
      throw new Error('Enter a fixed making charge and/or metal price.');
    }
    newWeight = Number(input.metal_weight_grams ?? pricing.metal_weight_grams ?? 0);
    newRate = Number(input.gold_rate_per_gram ?? pricing.gold_rate_per_gram ?? 0);
    newLaborPct = 0;
  }

  const newDiamond = Math.round(Number(input.diamond_charge ?? pricing.diamond_charge ?? 0));
  const newFee = Math.round(Number(input.custom_design_fee ?? pricing.custom_design_fee ?? 0));

  const metalDelta = newMetal - oldMetal;
  const makingDelta = newMaking - oldMaking;
  const diamondDelta = newDiamond - oldDiamond;
  const customFeeDelta = newFee - oldFee;

  const gstDelta =
    gstOnAmount(newMetal, GST_METAL_MOUNTED_PERCENT) -
    gstOnAmount(oldMetal, GST_METAL_MOUNTED_PERCENT) +
    (gstOnAmount(newMaking + newDiamond + newFee, GST_METAL_MOUNTED_PERCENT) -
      gstOnAmount(oldMaking + oldDiamond + oldFee, GST_METAL_MOUNTED_PERCENT));

  const totalDelta = roundMoney(
    metalDelta + makingDelta + diamondDelta + customFeeDelta + gstDelta,
  );

  const nextPricing: NonNullable<ConfigurationSnapshot['pricing']> = {
    ...pricing,
    metal_price: newMetal,
    making_charge: newMaking,
    diamond_charge: newDiamond,
    custom_design_fee: newFee,
    metal_weight_grams: newWeight,
    gold_rate_per_gram: newRate,
    labor_rate_percent: newLaborPct,
    jewelry_pricing_mode: mode,
    custom_design_pricing_pending: false,
    total: Math.round(
      Number(pricing.gem_price ?? 0) +
        newMaking +
        newDiamond +
        newMetal +
        Number(pricing.certification_fee ?? 0) +
        Number(pricing.energization_fee ?? 0) +
        newFee,
    ),
  };

  const nextSelections: NonNullable<ConfigurationSnapshot['selections']> = {
    ...parsed.selections,
    metal: input.metal?.trim() || parsed.selections?.metal || null,
  };

  return {
    metalDelta,
    makingDelta,
    diamondDelta,
    customFeeDelta,
    gstDelta: roundMoney(gstDelta),
    totalDelta,
    nextPricing,
    nextSelections,
  };
}

export function applyCustomDesignDeltaToOrderMoney(args: {
  metal_charges: number;
  jewelry_charges: number;
  gst_amount: number;
  total: number;
  amount_paid: number;
  quantity?: number;
  metalDelta: number;
  makingDelta: number;
  diamondDelta: number;
  customFeeDelta: number;
  gstDelta: number;
  totalDelta: number;
}): OrderMoneyAfterMetalAdjust {
  // jewelry_charges column stores making (+ diamond/custom fee components)
  return applyMetalDeltaToOrderMoney({
    metal_charges: args.metal_charges,
    jewelry_charges: args.jewelry_charges,
    gst_amount: args.gst_amount,
    total: args.total,
    amount_paid: args.amount_paid,
    quantity: args.quantity,
    metalDelta: args.metalDelta,
    makingDelta: args.makingDelta + args.diamondDelta + args.customFeeDelta,
    gstDelta: args.gstDelta,
    totalDelta: args.totalDelta,
  });
}

export function buildCustomDesignPriceNotifyCopy(args: {
  orderNumber: string;
  amountDue: number;
  totalDelta: number;
  itemName?: string | null;
}): { title: string; message: string } {
  const itemBit = args.itemName ? ` (${args.itemName})` : '';
  if (args.amountDue > 0.009) {
    return {
      title: 'Custom design mounting priced — balance due',
      message: `Order ${args.orderNumber}${itemBit}: your custom design mounting has been priced. Please pay the remaining ₹${args.amountDue.toLocaleString('en-IN')}.`,
    };
  }
  return {
    title: 'Custom design mounting priced',
    message: `Order ${args.orderNumber}${itemBit}: your custom design mounting price has been added to the order.`,
  };
}

// ponytail: `npx tsx -e "import { __customDesignPriceAdjustSelfCheck } from './src/lib/orders/custom-design-price-adjust.ts'; __customDesignPriceAdjustSelfCheck()"`
export function __customDesignPriceAdjustSelfCheck() {
  const snap = {
    selections: { custom_design_url: 'https://example.com/ref.png', metal: 'gold_18k' },
    pricing: {
      gem_price: 10000,
      making_charge: 0,
      diamond_charge: 0,
      metal_price: 0,
      metal_weight_grams: 0,
      gold_rate_per_gram: 0,
      labor_rate_percent: 0,
      jewelry_pricing_mode: null,
      certification_fee: 0,
      energization_fee: 0,
      custom_design_fee: 0,
      custom_design_pricing_pending: true,
      total: 10000,
    },
  };

  const priced = applyCustomDesignPriceToPricing(snap, {
    mode: 'weight',
    metal: 'gold_22k',
    metal_weight_grams: 5,
    gold_rate_per_gram: 1000,
    labor_rate_percent: 20,
  });
  console.assert(priced.nextPricing.custom_design_pricing_pending === false, 'clears pending');
  console.assert(priced.nextPricing.metal_price === 5000, '5g × 1000');
  console.assert(priced.nextPricing.making_charge === 1000, '20% labour');
  console.assert(priced.nextSelections.metal === 'gold_22k', 'metal updated');
  console.assert(priced.totalDelta > 0, 'total increases');

  const fixed = applyCustomDesignPriceToPricing(snap, {
    mode: 'fixed',
    making_charge: 4500,
  });
  console.assert(fixed.nextPricing.making_charge === 4500);
  console.assert(fixed.nextPricing.jewelry_pricing_mode === 'fixed');

  console.log('custom-design-price-adjust self-check ok');
}
