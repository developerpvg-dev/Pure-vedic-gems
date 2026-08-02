/**
 * Reprice an order line when actual metal weight differs from the quoted weight.
 * Uses the frozen gold_rate_per_gram from the configuration snapshot (not live rates).
 */

import { parseConfigurationSnapshot, type ConfigurationSnapshot } from '@/lib/utils/configuration-snapshot';
import { GST_METAL_MOUNTED_PERCENT, gstOnAmount } from '@/lib/utils/tax';
import { roundMoney } from '@/lib/orders/counter-payments';

export type MetalWeightAdjustKind = 'extra_charge' | 'refund' | 'unchanged';

export type MetalWeightAdjustResult = {
  kind: MetalWeightAdjustKind;
  oldWeightGrams: number;
  newWeightGrams: number;
  oldMetalPrice: number;
  newMetalPrice: number;
  oldMakingCharge: number;
  newMakingCharge: number;
  metalDelta: number;
  makingDelta: number;
  gstDelta: number;
  totalDelta: number;
  /** Snapshot pricing after the weight change. */
  nextPricing: NonNullable<ConfigurationSnapshot['pricing']>;
};

function roundGrams(n: number) {
  return Math.round(n * 1000) / 1000;
}

/** Apply a new actual metal weight to one line's snapshot pricing. */
export function applyMetalWeightToPricing(
  snapshot: unknown,
  newWeightGrams: number,
): MetalWeightAdjustResult {
  const parsed = parseConfigurationSnapshot(snapshot);
  const pricing = parsed?.pricing;
  if (!pricing) throw new Error('This item has no configuration pricing to adjust.');

  const mode = pricing.jewelry_pricing_mode;
  const rate = Number(pricing.gold_rate_per_gram ?? 0);
  const oldWeight = Number(pricing.metal_weight_grams ?? 0);
  if (mode === 'fixed') {
    throw new Error('This design uses fixed making charges, not metal weight.');
  }
  if (!(rate > 0)) throw new Error('Metal rate per gram is missing on this order line.');
  if (!(oldWeight > 0) && mode !== 'weight') {
    throw new Error('This item has no metal weight to adjust.');
  }

  const weight = roundGrams(newWeightGrams);
  if (!Number.isFinite(weight) || weight <= 0) {
    throw new Error('Enter a metal weight greater than zero.');
  }

  const oldMetal = Math.round(Number(pricing.metal_price ?? 0));
  const oldMaking = Math.round(Number(pricing.making_charge ?? 0));
  const laborPct = Number(pricing.labor_rate_percent ?? 0);

  const newMetal = Math.round(weight * rate);
  // Labor making scales with metal; fixed making / diamond stay put.
  const newMaking = laborPct > 0 ? Math.round((newMetal * laborPct) / 100) : oldMaking;

  const metalDelta = newMetal - oldMetal;
  const makingDelta = newMaking - oldMaking;
  const gstDelta =
    gstOnAmount(newMetal, GST_METAL_MOUNTED_PERCENT) -
    gstOnAmount(oldMetal, GST_METAL_MOUNTED_PERCENT) +
    (gstOnAmount(newMaking, GST_METAL_MOUNTED_PERCENT) - gstOnAmount(oldMaking, GST_METAL_MOUNTED_PERCENT));
  const totalDelta = roundMoney(metalDelta + makingDelta + gstDelta);

  const quotedWeight =
    typeof pricing.quoted_metal_weight_grams === 'number' && pricing.quoted_metal_weight_grams > 0
      ? pricing.quoted_metal_weight_grams
      : oldWeight;

  const nextPricing: NonNullable<ConfigurationSnapshot['pricing']> = {
    ...pricing,
    quoted_metal_weight_grams: quotedWeight,
    metal_weight_grams: weight,
    metal_price: newMetal,
    making_charge: newMaking,
    jewelry_pricing_mode: 'weight',
    total: Math.round(
      Number(pricing.gem_price ?? 0) +
        newMaking +
        Number(pricing.diamond_charge ?? 0) +
        newMetal +
        Number(pricing.certification_fee ?? 0) +
        Number(pricing.energization_fee ?? 0) +
        Number(pricing.custom_design_fee ?? 0),
    ),
  };

  const kind: MetalWeightAdjustKind =
    Math.abs(totalDelta) < 0.009 ? 'unchanged' : totalDelta > 0 ? 'extra_charge' : 'refund';

  return {
    kind,
    oldWeightGrams: oldWeight,
    newWeightGrams: weight,
    oldMetalPrice: oldMetal,
    newMetalPrice: newMetal,
    oldMakingCharge: oldMaking,
    newMakingCharge: newMaking,
    metalDelta,
    makingDelta,
    gstDelta: roundMoney(gstDelta),
    totalDelta,
    nextPricing,
  };
}

export type OrderMoneyAfterMetalAdjust = {
  metal_charges: number;
  jewelry_charges: number;
  gst_amount: number;
  total: number;
  amount_due: number;
  payment_status: 'partial' | 'captured';
  /** Positive when customer overpaid after a weight reduction. */
  refund_due: number;
};

/** Fold a line metal-weight delta into order money columns. */
export function applyMetalDeltaToOrderMoney(args: {
  metal_charges: number;
  jewelry_charges: number;
  gst_amount: number;
  total: number;
  amount_paid: number;
  quantity?: number;
  metalDelta: number;
  makingDelta: number;
  gstDelta: number;
  totalDelta: number;
}): OrderMoneyAfterMetalAdjust {
  const qty = Math.max(1, Math.round(args.quantity ?? 1));
  const metalCharges = roundMoney(Number(args.metal_charges) + args.metalDelta * qty);
  const jewelryCharges = roundMoney(Number(args.jewelry_charges) + args.makingDelta * qty);
  const gstAmount = Math.round(Number(args.gst_amount) + args.gstDelta * qty);
  const total = roundMoney(Math.max(0, Number(args.total) + args.totalDelta * qty));
  const paid = roundMoney(Number(args.amount_paid));
  const amountDue = roundMoney(Math.max(0, total - paid));
  const refundDue = roundMoney(Math.max(0, paid - total));
  return {
    metal_charges: metalCharges,
    jewelry_charges: jewelryCharges,
    gst_amount: gstAmount,
    total,
    amount_due: amountDue,
    payment_status: amountDue > 0.009 ? 'partial' : 'captured',
    refund_due: refundDue,
  };
}

export function buildMetalWeightNotifyCopy(args: {
  orderNumber: string;
  oldWeightGrams: number;
  newWeightGrams: number;
  totalDelta: number;
  amountDue: number;
  refundDue: number;
  itemName?: string | null;
}): { title: string; message: string; kind: MetalWeightAdjustKind } {
  const itemBit = args.itemName ? ` (${args.itemName})` : '';
  const weightBit = `${args.oldWeightGrams} g → ${args.newWeightGrams} g`;
  if (args.refundDue > 0.009 || args.totalDelta < -0.009) {
    const refund = args.refundDue > 0.009 ? args.refundDue : Math.abs(args.totalDelta);
    return {
      kind: 'refund',
      title: 'Metal weight updated — refund due',
      message: `Order ${args.orderNumber}${itemBit}: actual metal weight ${weightBit}. ₹${refund.toLocaleString('en-IN')} will be refunded / credited.`,
    };
  }
  if (args.amountDue > 0.009 && args.totalDelta > 0.009) {
    return {
      kind: 'extra_charge',
      title: 'Metal weight updated — extra amount due',
      message: `Order ${args.orderNumber}${itemBit}: actual metal weight ${weightBit}. Please pay the remaining ₹${args.amountDue.toLocaleString('en-IN')}.`,
    };
  }
  if (args.totalDelta > 0.009) {
    return {
      kind: 'extra_charge',
      title: 'Metal weight updated — order total increased',
      message: `Order ${args.orderNumber}${itemBit}: actual metal weight ${weightBit}. Order total increased by ₹${args.totalDelta.toLocaleString('en-IN')}; remaining due is ₹${args.amountDue.toLocaleString('en-IN')}.`,
    };
  }
  if (args.totalDelta < -0.009) {
    return {
      kind: 'refund',
      title: 'Metal weight updated — order total reduced',
      message: `Order ${args.orderNumber}${itemBit}: actual metal weight ${weightBit}. Order total reduced by ₹${Math.abs(args.totalDelta).toLocaleString('en-IN')}; remaining due is now ₹${args.amountDue.toLocaleString('en-IN')}.`,
    };
  }
  return {
    kind: 'unchanged',
    title: 'Metal weight updated',
    message: `Order ${args.orderNumber}${itemBit}: metal weight set to ${args.newWeightGrams} g (no price change).`,
  };
}

// ponytail: `npx tsx -e "import { __metalWeightAdjustSelfCheck } from './src/lib/orders/metal-weight-adjust.ts'; __metalWeightAdjustSelfCheck()"`
export function __metalWeightAdjustSelfCheck() {
  const snap = {
    pricing: {
      gem_price: 10000,
      making_charge: 500,
      diamond_charge: 0,
      metal_price: 4500,
      metal_weight_grams: 4.5,
      gold_rate_per_gram: 1000,
      labor_rate_percent: 10,
      jewelry_pricing_mode: 'weight',
      certification_fee: 0,
      energization_fee: 0,
      custom_design_fee: 0,
      total: 15000,
    },
  };

  const up = applyMetalWeightToPricing(snap, 5);
  console.assert(up.newMetalPrice === 5000, '5g × 1000');
  console.assert(up.newMakingCharge === 500, '10% of 5000');
  console.assert(up.metalDelta === 500, 'metal +500');
  console.assert(up.makingDelta === 0, 'making was already 500');
  console.assert(up.kind === 'extra_charge');

  const down = applyMetalWeightToPricing(snap, 4);
  console.assert(down.newMetalPrice === 4000);
  console.assert(down.newMakingCharge === 400, 'labor scales down');
  console.assert(down.kind === 'refund');

  const money = applyMetalDeltaToOrderMoney({
    metal_charges: 4500,
    jewelry_charges: 500,
    gst_amount: 160,
    total: 15160,
    amount_paid: 15160,
    metalDelta: up.metalDelta,
    makingDelta: up.makingDelta,
    gstDelta: up.gstDelta,
    totalDelta: up.totalDelta,
  });
  console.assert(money.amount_due > 0 && money.payment_status === 'partial', 'fully paid + extra → due');
  console.assert(money.refund_due === 0);

  const refundMoney = applyMetalDeltaToOrderMoney({
    metal_charges: 4500,
    jewelry_charges: 500,
    gst_amount: 160,
    total: 15160,
    amount_paid: 15160,
    metalDelta: down.metalDelta,
    makingDelta: down.makingDelta,
    gstDelta: down.gstDelta,
    totalDelta: down.totalDelta,
  });
  console.assert(refundMoney.amount_due === 0 && refundMoney.refund_due > 0, 'fully paid + less → refund');

  const partial = applyMetalDeltaToOrderMoney({
    metal_charges: 4500,
    jewelry_charges: 500,
    gst_amount: 160,
    total: 15160,
    amount_paid: 5000,
    metalDelta: down.metalDelta,
    makingDelta: down.makingDelta,
    gstDelta: down.gstDelta,
    totalDelta: down.totalDelta,
  });
  console.assert(partial.amount_due < 15160 - 5000, 'partial: due shrinks');
  console.assert(partial.refund_due === 0);

  console.log('metal-weight-adjust self-check ok');
}
