import assert from 'node:assert/strict';
import {
  applyJewelleryGstDeltaToTaxBreakdown,
  formatGstRatePercent,
  gstSummaryLabel,
  parseOrderTaxBreakdown,
  taxBreakdownEmailRows,
} from './tax-breakdown-display';
import { buildOrderPriceLines } from './price-breakdown-lines';

assert.equal(formatGstRatePercent(0.25), '0.25%');
assert.equal(formatGstRatePercent(3), '3%');

const sample = {
  policy_version: '2026-08-03',
  seller_state: 'Delhi',
  destination_state: 'Maharashtra',
  jurisdiction: 'inter_state',
  components: [
    {
      label: 'African Ruby',
      component: 'product',
      taxable_amount: 99930,
      hsn_code: '7103',
      rate_percent: 0.25,
      cgst: 0,
      sgst: 0,
      igst: 249.83,
      total_tax: 249.83,
    },
    {
      label: 'Jewellery (gem/bead + metal + labour + stone add-on)',
      component: 'metal',
      taxable_amount: 140645,
      hsn_code: '7113',
      rate_percent: 3,
      cgst: 0,
      sgst: 0,
      igst: 4219.35,
      total_tax: 4219.35,
    },
  ],
  totals: {
    taxable_amount: 240575,
    cgst: 0,
    sgst: 0,
    igst: 4469.18,
    gst_amount: 4469.18,
  },
  notes: [],
};

const view = parseOrderTaxBreakdown(sample);
assert.ok(view);
assert.equal(view!.components.length, 2);
assert.equal(view!.components[0]!.ratePercent, 0.25);
assert.equal(view!.igst, 4469.18);
assert.equal(gstSummaryLabel(view), 'GST (0.25% + 3%)');

const lines = buildOrderPriceLines({
  subtotal: 99930,
  gst_amount: 250,
  tax_breakdown: {
    components: [
      {
        label: 'Loose stone',
        taxable_amount: 99930,
        rate_percent: 0.25,
        total_tax: 249.83,
      },
    ],
    totals: { gst_amount: 249.83, cgst: 0, sgst: 0, igst: 249.83, taxable_amount: 99930 },
  },
});
const gstLine = lines.find((l) => l.key === 'gst');
assert.equal(gstLine?.label, 'GST (0.25%)');

const patched = applyJewelleryGstDeltaToTaxBreakdown(sample, {
  gstDelta: 30,
  jewelleryTaxableDelta: 1000,
  nextGstAmount: 4499,
});
assert.ok(patched);
const patchedView = parseOrderTaxBreakdown(patched);
assert.ok(patchedView);
assert.equal(patchedView!.gstAmount, 4499);

const emailRows = taxBreakdownEmailRows(sample);
assert.ok(emailRows.some((r) => r.label.includes('0.25%')));
assert.ok(emailRows.some((r) => r.label.includes('3%')));

assert.equal(parseOrderTaxBreakdown(null), null);
console.log('tax-breakdown-display self-check ok');

