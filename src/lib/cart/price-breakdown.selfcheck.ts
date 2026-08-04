import assert from 'node:assert/strict';
import { buildCartItemPriceBreakdown } from './price-breakdown';
import type { CartItem } from '@/lib/types/cart';
import { jewelleryPriceInclGst } from '@/lib/utils/tax';

const plain: CartItem = {
  key: 'p1',
  product_id: '1',
  sku: 'SKU-1',
  name: 'Ruby',
  category: 'ruby',
  image_url: '',
  price: 10000,
  quantity: 1,
  carat_weight: 1,
  origin: null,
};

const plainBreak = buildCartItemPriceBreakdown(plain);
assert.equal(plainBreak.lines.length, 1);
assert.equal(plainBreak.preGstSubtotal, 10000);
// Loose gemstone: 0% GST
assert.equal(plainBreak.estimatedGst, 0);
assert.equal(plainBreak.gstLines.length, 0);

const readyJewellery: CartItem = {
  ...plain,
  key: 'j1',
  name: 'Gold Ring',
  category: 'jewelry',
  price: 10000,
};
const jewBreak = buildCartItemPriceBreakdown(readyJewellery);
assert.equal(jewBreak.estimatedGst, Math.round(10000 * 0.03));
assert.equal(jewBreak.gstLines.length, 0);
assert.equal(jewBreak.lines[0]?.amount, jewelleryPriceInclGst(10000));

const configured: CartItem = {
  ...plain,
  key: 'c1',
  configuration_id: 'cfg',
  configuration_snapshot: {
    selections: { setting_type: 'ring' },
    product: { category: 'ruby' },
    pricing: {
      gem_price: 8000,
      metal_price: 2000,
      making_charge: 500,
      diamond_charge: 0,
      certification_fee: 0,
      energization_fee: 300,
      custom_design_fee: 0,
      jewelry_pricing_mode: 'weight',
      metal_weight_grams: 2,
      gold_rate_per_gram: 1000,
      total: 10800,
    },
  },
};

const cfgBreak = buildCartItemPriceBreakdown(configured);
assert.ok(cfgBreak.lines.some((l) => l.key === 'gem'));
assert.ok(cfgBreak.lines.some((l) => l.key === 'energization' || l.label.includes('Energization')));
assert.equal(cfgBreak.preGstSubtotal, 10800);
assert.equal(cfgBreak.gstLines.length, 0);
assert.ok(cfgBreak.estimatedGst > 0);
assert.equal(
  cfgBreak.lines.find((l) => l.key === 'est-mounting')?.amount,
  jewelleryPriceInclGst(2500),
);

console.log('cart price-breakdown self-check ok');
