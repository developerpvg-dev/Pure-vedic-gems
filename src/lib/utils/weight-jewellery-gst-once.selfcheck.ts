/**
 * Assert weight+labour tax is applied exactly once across display + client estimate.
 * Customer never sees a "GST" line — amounts are baked into mounting/totals.
 * Run: npx tsx src/lib/utils/weight-jewellery-gst-once.selfcheck.ts
 */
import assert from 'node:assert/strict';
import { estimateClientTax, gstOnJewellery, jewelleryPriceInclGst } from './tax';
import { buildConfiguratorPriceTotals } from './configurator-pricing-display';
import type { ConfigPricingBreakdown } from '@/lib/types/configurator';

const gem = 10_000;
const metal = 24_000;
const labour = 6_000;
const diamond = 0;
const expectedGst = Math.round(gstOnJewellery({ metal, making: labour, diamond }, 'weight'));

const pricing: ConfigPricingBreakdown = {
  gem_price: gem,
  making_charge: labour,
  diamond_charge: diamond,
  stone_addon_label: null,
  design_note: null,
  metal_price: metal,
  metal_weight_grams: 5,
  gold_rate_per_gram: 4800,
  labor_rate_percent: 25,
  jewelry_pricing_mode: 'weight',
  certification_fee: 0,
  energization_fee: 0,
  custom_design_fee: 0,
  total: gem + metal + labour,
};

const totals = buildConfiguratorPriceTotals(pricing, {
  settingType: 'ring',
  productCategory: 'gemstone',
});

assert.equal(totals.gst_total, expectedGst);
assert.equal(Math.round(totals.gst_jewelry), expectedGst);
assert.equal(totals.lines.find((l) => l.key === 'gst'), undefined);
assert.ok(totals.lines.every((l) => !/gst|cgst|sgst|igst/i.test(l.label)));
assert.equal(
  totals.lines.find((l) => l.key === 'est-mounting')?.amount,
  jewelleryPriceInclGst(metal + labour, 'weight'),
);

assert.equal(totals.pre_gst_subtotal, gem + metal + labour);
assert.equal(totals.grand_total, totals.pre_gst_subtotal + expectedGst);

const lineSum = totals.lines.reduce(
  (s, l) => s + (typeof l.amount === 'number' ? l.amount : 0),
  0,
);
assert.equal(lineSum, totals.grand_total, 'line sum must equal grand_total (tax counted once)');

assert.equal(
  estimateClientTax(
    [
      {
        price: gem + metal + labour,
        quantity: 1,
        category: 'gemstone',
        configuration_snapshot: {
          selections: { setting_type: 'ring' },
          pricing: {
            gem_price: gem,
            metal_price: metal,
            making_charge: labour,
            diamond_charge: 0,
            jewelry_pricing_mode: 'weight',
            total: gem + metal + labour,
          },
        },
      },
    ],
    0,
  ),
  expectedGst,
);

// Fixed sheet: zero auto tax even with making charges
const fixedPricing: ConfigPricingBreakdown = {
  ...pricing,
  jewelry_pricing_mode: 'fixed',
  metal_price: 0,
  metal_weight_grams: 0,
  gold_rate_per_gram: 0,
  labor_rate_percent: 0,
  making_charge: 7000,
  total: gem + 7000,
};
const fixedTotals = buildConfiguratorPriceTotals(fixedPricing, {
  settingType: 'ring',
  productCategory: 'gemstone',
});
assert.equal(fixedTotals.gst_total, 0);
assert.equal(fixedTotals.lines.find((l) => l.key === 'gst'), undefined);

console.log('weight-jewellery-gst-once self-check ok');
