/**
 * Full GST policy matrix: online / offline / international.
 * Run: npx tsx src/lib/utils/gst-policy-matrix.selfcheck.ts
 */
import assert from 'node:assert/strict';
import {
  appliesAutoJewelleryGst,
  buildTaxBreakdown,
  calculateGstComponent,
  estimateClientTax,
  getTaxJurisdiction,
  GST_METAL_MOUNTED_PERCENT,
  gstOnAmount,
  resolveProductTax,
  weightJewelleryTaxableFromConfig,
} from './tax';

const metal = 100_000;
const labour = 25_000;
const diamond = 10_000;
const custom = 0;
const gem = 50_000;

const weightSnap = {
  metal_price: metal,
  making_charge: labour,
  diamond_charge: diamond,
  custom_design_fee: custom,
  jewelry_pricing_mode: 'weight' as const,
  metal_weight_grams: 10,
};

const fixedSnap = {
  metal_price: 0,
  making_charge: 8_500,
  diamond_charge: 2_000,
  custom_design_fee: 0,
  jewelry_pricing_mode: 'fixed' as const,
  metal_weight_grams: 0,
};

// ── Mode gating ──────────────────────────────────────────────────────────
assert.equal(appliesAutoJewelleryGst('weight'), true);
assert.equal(appliesAutoJewelleryGst('fixed'), false);
assert.equal(appliesAutoJewelleryGst(null), false);

// ── Weight base = metal + labour + diamond (+ custom) once ───────────────
const weight = weightJewelleryTaxableFromConfig({ snapshotPricing: weightSnap });
assert.equal(weight.mode, 'weight');
assert.equal(weight.taxable, metal + labour + diamond + custom);
const expectedGst = Math.round(gstOnAmount(weight.taxable, GST_METAL_MOUNTED_PERCENT));
assert.equal(expectedGst, Math.round((metal + labour + diamond) * 0.03));

// DB fallback folds diamond into making_charge (configurator save shape)
const dbFallback = weightJewelleryTaxableFromConfig({
  snapshotPricing: {
    jewelry_pricing_mode: 'weight',
    metal_weight_grams: 10,
    metal_price: metal,
  },
  db: {
    metal_price: metal,
    making_charge: labour + diamond,
    custom_design_fee: custom,
  },
});
// Prefer snapshot when parts present — here metal present but making/diamond null on snap.
// Snap has metal_price set → hasSnapParts true → taxable uses snap making/diamond as 0.
// Ensure DB-only path works when snapshot has no part amounts:
const dbOnly = weightJewelleryTaxableFromConfig({
  snapshotPricing: {
    jewelry_pricing_mode: 'weight',
    metal_weight_grams: 10,
    metal_price: null,
    making_charge: null,
    diamond_charge: null,
    custom_design_fee: null,
  },
  db: {
    metal_price: metal,
    making_charge: labour + diamond,
    custom_design_fee: 0,
  },
});
assert.equal(dbOnly.taxable, metal + labour + diamond);

// ── Fixed sheet / ready SKU / manual offline → 0 ─────────────────────────
assert.equal(weightJewelleryTaxableFromConfig({ snapshotPricing: fixedSnap }).taxable, 0);
assert.equal(resolveProductTax({ category: 'jewelry' }).rate_percent, 0);
assert.equal(resolveProductTax({ category: 'Ruby' }).rate_percent, 0);
assert.equal(resolveProductTax({ category: 'jewelry', gst_rate: 5 }).rate_percent, 0);

assert.equal(
  estimateClientTax(
    [{ price: 50_000, quantity: 1, category: 'jewelry' }],
    1_500,
  ),
  0,
);

assert.equal(
  estimateClientTax(
    [
      {
        price: gem + 8_500 + 2_000,
        quantity: 1,
        category: 'gemstone',
        configuration_snapshot: { pricing: { ...fixedSnap, gem_price: gem, total: gem + 10500 } },
      },
    ],
    0,
  ),
  0,
);

// Offline manual design has no config snapshot → product path; manual lines skip GST on server.
// Client estimate without snapshot on a gemstone price → 0 product tax.
assert.equal(estimateClientTax([{ price: 9_000, quantity: 1, category: 'manual_design' }], 0), 0);

// ── Online weight (India Delhi) vs Maharashtra vs international ──────────
const clientIn = estimateClientTax(
  [
    {
      price: gem + metal + labour + diamond,
      quantity: 1,
      category: 'gemstone',
      configuration_snapshot: {
        pricing: { ...weightSnap, gem_price: gem, total: gem + metal + labour + diamond },
      },
    },
  ],
  2_000,
);
assert.equal(clientIn, expectedGst, 'India online weight GST');

const clientUs = estimateClientTax(
  [
    {
      price: gem + metal + labour + diamond,
      quantity: 1,
      category: 'gemstone',
      configuration_snapshot: {
        pricing: { ...weightSnap, gem_price: gem, total: gem + metal + labour + diamond },
      },
    },
  ],
  5_000,
);
assert.equal(clientUs, expectedGst, 'International online: same GST amount');

const delhi = buildTaxBreakdown('Delhi', [
  calculateGstComponent({
    label: 'Jewellery (weight + labour %)',
    component: 'metal',
    amount: weight.taxable,
    ratePercent: GST_METAL_MOUNTED_PERCENT,
    hsnCode: '7113',
    destinationState: 'Delhi',
  }),
]);
assert.equal(getTaxJurisdiction('Delhi'), 'intra_state');
assert.equal(Math.round(delhi.totals.gst_amount), expectedGst);
assert.ok(delhi.totals.cgst > 0 && delhi.totals.sgst > 0 && delhi.totals.igst === 0);

const london = buildTaxBreakdown('London', [
  calculateGstComponent({
    label: 'Jewellery (weight + labour %)',
    component: 'metal',
    amount: weight.taxable,
    ratePercent: GST_METAL_MOUNTED_PERCENT,
    hsnCode: '7113',
    destinationState: 'London',
  }),
]);
assert.equal(getTaxJurisdiction('London'), 'inter_state');
assert.equal(Math.round(london.totals.gst_amount), expectedGst, 'intl jurisdiction amount match');
assert.equal(london.totals.igst, expectedGst);
assert.equal(london.totals.cgst, 0);

const mumbai = buildTaxBreakdown('Maharashtra', [
  calculateGstComponent({
    label: 'Jewellery (weight + labour %)',
    component: 'metal',
    amount: weight.taxable,
    ratePercent: GST_METAL_MOUNTED_PERCENT,
    hsnCode: '7113',
    destinationState: 'Maharashtra',
  }),
]);
assert.equal(Math.round(mumbai.totals.gst_amount), expectedGst);
assert.equal(mumbai.totals.igst, expectedGst);

// Shipping never taxed
assert.equal(gstOnAmount(9_999, 0), 0);

console.log('gst-policy-matrix self-check ok');
