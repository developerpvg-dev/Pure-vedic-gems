import assert from 'node:assert/strict';
import {
  applyJewelleryGstDeltaToTaxBreakdown,
  formatGstRatePercent,
  gstSummaryLabel,
  parseOrderTaxBreakdown,
  taxBreakdownEmailRows,
} from './tax-breakdown-display';
import { buildOrderPriceLines } from './price-breakdown-lines';
import { jewelleryPriceInclGst } from '@/lib/utils/tax';

assert.equal(formatGstRatePercent(0.25), '0.25%');
assert.equal(formatGstRatePercent(3), '3%');

const sample = {
  policy_version: '2026-08-04',
  seller_state: 'Delhi',
  destination_state: 'Maharashtra',
  jurisdiction: 'inter_state',
  components: [
    {
      label: 'Jewellery (metal + labour + stone add-on)',
      component: 'metal',
      taxable_amount: 10000,
      hsn_code: '7113',
      rate_percent: 3,
      cgst: 0,
      sgst: 0,
      igst: 300,
      total_tax: 300,
    },
  ],
  totals: {
    taxable_amount: 10000,
    cgst: 0,
    sgst: 0,
    igst: 300,
    gst_amount: 300,
  },
  notes: [],
};

const view = parseOrderTaxBreakdown(sample);
assert.ok(view);
assert.equal(view!.components.length, 1);
assert.equal(view!.components[0]!.ratePercent, 3);
assert.equal(view!.igst, 300);
assert.equal(gstSummaryLabel(view), 'GST (3%)');

// Inclusive display: jewellery GST folded into metal/making — no GST line.
const lines = buildOrderPriceLines({
  subtotal: 99930,
  jewelry_charges: 10000,
  metal_charges: 0,
  gst_amount: 300,
  tax_breakdown: sample,
});
assert.equal(lines.find((l) => l.key === 'gst'), undefined);
assert.equal(lines.find((l) => l.key === 'jewelry')?.amount, jewelleryPriceInclGst(10000));

// Ready bracelet/jewellery SKU: bake 3% into product subtotal (no metal line).
const readyJewelleryTax = {
  ...sample,
  components: [
    {
      label: 'Bracelet',
      component: 'product',
      taxable_amount: 10000,
      hsn_code: '7113',
      rate_percent: 3,
      cgst: 0,
      sgst: 0,
      igst: 300,
      total_tax: 300,
    },
  ],
};
const readyLines = buildOrderPriceLines({
  subtotal: 10000,
  jewelry_charges: 0,
  metal_charges: 0,
  gst_amount: 300,
  tax_breakdown: readyJewelleryTax,
});
assert.equal(readyLines.find((l) => l.key === 'gst'), undefined);
assert.equal(readyLines.find((l) => l.key === 'subtotal')?.amount, 10300);

const patched = applyJewelleryGstDeltaToTaxBreakdown(sample, {
  gstDelta: 30,
  jewelleryTaxableDelta: 1000,
  nextGstAmount: 330,
});
assert.ok(patched);
const patchedView = parseOrderTaxBreakdown(patched);
assert.ok(patchedView);
assert.equal(patchedView!.gstAmount, 330);

const emailRows = taxBreakdownEmailRows(sample);
assert.ok(emailRows.some((r) => r.label.includes('3%')));

assert.equal(parseOrderTaxBreakdown(null), null);
console.log('tax-breakdown-display self-check ok');
