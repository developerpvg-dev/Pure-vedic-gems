/**
 * Internal GST policy: every shop category — 0% everywhere except
 * weight + labour metal jewellery @ 3% once (no hidden / no second GST).
 */
import { describe, expect, it } from 'vitest';
import {
  buildTaxBreakdown,
  calculateGstComponent,
  estimateClientTax,
  getTaxJurisdiction,
  GST_METAL_MOUNTED_PERCENT,
  gstOnAmount,
  gstOnJewellery,
  jewelleryPriceInclGst,
  resolveProductTax,
  weightJewelleryTaxableFromConfig,
} from '@/lib/utils/tax';
import { buildConfiguratorPriceTotals } from '@/lib/utils/configurator-pricing-display';
import { buildOrderPriceLines } from '@/lib/orders/price-breakdown-lines';
import { buildCartItemPriceBreakdown } from '@/lib/cart/price-breakdown';
import type { ConfigPricingBreakdown } from '@/lib/types/configurator';
import type { CartItem } from '@/lib/types/cart';
import { BASE_CATEGORY_MAP, KNOWN_GEM_SUBCATEGORIES } from '@/lib/categories/shop';

/** Distinct product `category` values used on catalog / cart lines. */
const SHOP_PRODUCT_CATEGORIES = Array.from(
  new Set(
    [
      ...Object.values(BASE_CATEGORY_MAP)
        .map((c) => c.category)
        .filter((c): c is string => Boolean(c)),
      ...Object.values(KNOWN_GEM_SUBCATEGORIES).map((c) => c.category),
      // Common DB / PDP category strings that hit resolveProductTax
      'gemstone',
      'navaratna',
      'upratna',
      'rudraksha',
      'jewelry',
      'jewellery',
      'mala',
      'idol',
      'Ruby',
      'Emerald',
      'Yellow Sapphire',
      'Blue Sapphire',
      'Pearl',
      'Red Coral',
      'Hessonite',
      "Cat's Eye",
      'Diamond',
      'White Sapphire',
      'yantra',
      'ring',
      'pendant',
      'bracelet',
      'gold ring',
      'silver pendant',
    ].map((s) => s.trim()),
  ),
);

function looseItem(category: string, price = 50_000) {
  return { price, quantity: 1, category };
}

function weightConfigSnapshot(category: string, parts: {
  gem?: number;
  metal: number;
  making: number;
  diamond?: number;
  custom?: number;
  cert?: number;
  energ?: number;
}) {
  const gem = parts.gem ?? 40_000;
  const diamond = parts.diamond ?? 0;
  const custom = parts.custom ?? 0;
  const cert = parts.cert ?? 0;
  const energ = parts.energ ?? 0;
  const total = gem + parts.metal + parts.making + diamond + custom + cert + energ;
  return {
    product: { category },
    pricing: {
      gem_price: gem,
      metal_price: parts.metal,
      making_charge: parts.making,
      diamond_charge: diamond,
      custom_design_fee: custom,
      certification_fee: cert,
      energization_fee: energ,
      jewelry_pricing_mode: 'weight' as const,
      metal_weight_grams: 5,
      gold_rate_per_gram: parts.metal / 5,
      labor_rate_percent: 25,
      total,
    },
  };
}

function fixedConfigSnapshot(category: string, making = 8_500, diamond = 2_000) {
  const gem = 40_000;
  return {
    product: { category },
    pricing: {
      gem_price: gem,
      metal_price: 0,
      making_charge: making,
      diamond_charge: diamond,
      custom_design_fee: 0,
      certification_fee: 0,
      energization_fee: 0,
      jewelry_pricing_mode: 'fixed' as const,
      metal_weight_grams: 0,
      total: gem + making + diamond,
    },
  };
}

describe('GST policy — every shop category (loose / ready SKU)', () => {
  it.each(SHOP_PRODUCT_CATEGORIES)(
    'category %s: product tax rate is 0 (no hidden catalog GST)',
    (category) => {
      expect(resolveProductTax({ category }).rate_percent).toBe(0);
      // Even if someone set products.gst_rate in DB — ignored
      expect(resolveProductTax({ category, gst_rate: 18 }).rate_percent).toBe(0);
    },
  );

  it.each(SHOP_PRODUCT_CATEGORIES)(
    'category %s: estimateClientTax on plain product is 0 (IN shipping ignored)',
    (category) => {
      expect(estimateClientTax([looseItem(category)], 2_500)).toBe(0);
    },
  );

  it.each(SHOP_PRODUCT_CATEGORIES)(
    'category %s: cart line breakdown has no auto GST on ready/loose SKU',
    (category) => {
      const item: CartItem = {
        key: `k-${category}`,
        product_id: 'p1',
        sku: 'SKU',
        name: category,
        category,
        image_url: '',
        price: 25_000,
        quantity: 1,
        carat_weight: null,
        origin: null,
      };
      const break_ = buildCartItemPriceBreakdown(item);
      expect(break_.estimatedGst).toBe(0);
      expect(break_.lines.find((l) => l.key === 'gst')).toBeUndefined();
      expect(break_.lines[0]?.amount).toBe(25_000);
    },
  );
});

describe('GST policy — every category with FIXED jewellery sheet (staff-inclusive)', () => {
  const categoriesThatMount = SHOP_PRODUCT_CATEGORIES.filter(
    (c) => !/mala|idol|yantra|service|consult/i.test(c),
  );

  it.each(categoriesThatMount)(
    'category %s + fixed sheet: client estimate GST = 0',
    (category) => {
      const snap = fixedConfigSnapshot(category);
      expect(
        estimateClientTax(
          [
            {
              price: snap.pricing.total,
              quantity: 1,
              category,
              configuration_snapshot: snap,
            },
          ],
          1_000,
        ),
      ).toBe(0);
    },
  );

  it.each(categoriesThatMount)(
    'category %s + fixed sheet: configurator shows no GST line / no bake',
    (category) => {
      const snap = fixedConfigSnapshot(category);
      const pricing: ConfigPricingBreakdown = {
        gem_price: snap.pricing.gem_price,
        making_charge: snap.pricing.making_charge,
        diamond_charge: snap.pricing.diamond_charge,
        stone_addon_label: 'Diamond',
        design_note: null,
        metal_price: 0,
        metal_weight_grams: 0,
        gold_rate_per_gram: 0,
        labor_rate_percent: 0,
        jewelry_pricing_mode: 'fixed',
        certification_fee: 0,
        energization_fee: 0,
        custom_design_fee: 0,
        total: snap.pricing.total,
      };
      const totals = buildConfiguratorPriceTotals(pricing, {
        settingType: 'ring',
        productCategory: category,
      });
      expect(totals.gst_total).toBe(0);
      expect(totals.gst_jewelry).toBe(0);
      expect(totals.lines.find((l) => l.key === 'gst')).toBeUndefined();
      expect(totals.lines.find((l) => l.key === 'est-mounting')?.amount).toBe(8_500);
      expect(totals.grand_total).toBe(totals.pre_gst_subtotal);
    },
  );
});

describe('GST policy — every category with WEIGHT + labour metal jewellery (3% once)', () => {
  const mountCategories = ['gemstone', 'navaratna', 'upratna', 'rudraksha', 'Ruby', 'Emerald', 'jewelry'];

  it.each(mountCategories)(
    'category %s + weight: GST = exactly 3% of (metal+labour+diamond), once',
    (category) => {
      const metal = 41_300;
      const making = 10_325;
      const diamond = 17_500;
      const snap = weightConfigSnapshot(category, { metal, making, diamond, cert: 4_000, energ: 2_100 });
      const taxable = metal + making + diamond;
      const expected = Math.round(gstOnAmount(taxable, GST_METAL_MOUNTED_PERCENT));
      expect(expected).toBe(Math.round(taxable * 0.03));

      // Shared taxable helper (server + client)
      const { mode, taxable: base } = weightJewelleryTaxableFromConfig({
        snapshotPricing: snap.pricing,
      });
      expect(mode).toBe('weight');
      expect(base).toBe(taxable);

      // Client estimate (online cart / checkout / intl — amount same)
      const gstIn = estimateClientTax(
        [{ price: snap.pricing.total, quantity: 1, category, configuration_snapshot: snap }],
        2_000,
      );
      const gstIntl = estimateClientTax(
        [{ price: snap.pricing.total, quantity: 1, category, configuration_snapshot: snap }],
        9_000,
      );
      expect(gstIn).toBe(expected);
      expect(gstIntl).toBe(expected);

      // Configurator: bake 3% into jewellery lines; never a GST row
      const pricing: ConfigPricingBreakdown = {
        gem_price: snap.pricing.gem_price,
        making_charge: making,
        diamond_charge: diamond,
        stone_addon_label: 'Diamond',
        design_note: null,
        metal_price: metal,
        metal_weight_grams: 5,
        gold_rate_per_gram: metal / 5,
        labor_rate_percent: 25,
        jewelry_pricing_mode: 'weight',
        certification_fee: 4_000,
        energization_fee: 2_100,
        custom_design_fee: 0,
        total: snap.pricing.total,
      };
      const totals = buildConfiguratorPriceTotals(pricing, {
        settingType: 'ring',
        productCategory: category,
      });
      expect(totals.gst_total).toBe(expected);
      expect(totals.gst_jewelry).toBe(expected);
      expect(totals.lines.find((l) => l.key === 'est-mounting')?.amount).toBe(
        metal + making + expected,
      );
      expect(totals.lines.find((l) => l.key === 'stone-addon')?.amount).toBe(diamond);
      expect(totals.lines.find((l) => l.key === 'gst')).toBeUndefined();
      expect(totals.lines.every((l) => !/gst|cgst|sgst|igst/i.test(l.label))).toBe(true);
      expect(totals.grand_total).toBe(totals.pre_gst_subtotal + expected);

      const lineSum = totals.lines.reduce(
        (s, l) => s + (typeof l.amount === 'number' ? l.amount : 0),
        0,
      );
      expect(lineSum).toBe(totals.grand_total);

      // jewelleryPriceInclGst must not invent a second 3% on top of already-taxed total
      expect(jewelleryPriceInclGst(taxable, 'weight')).toBe(
        Math.round((taxable + gstOnAmount(taxable, GST_METAL_MOUNTED_PERCENT)) * 100) / 100,
      );
      expect(jewelleryPriceInclGst(taxable, 'fixed')).toBe(taxable);
    },
  );

  it('gem / cert / energization / shipping never enter the 3% base', () => {
    const metal = 10_000;
    const making = 2_500;
    const diamond = 1_000;
    expect(gstOnJewellery({ metal, making, diamond, custom: 500 }, 'weight')).toBe(
      gstOnAmount(metal + making + diamond + 500, GST_METAL_MOUNTED_PERCENT),
    );
    // Loose gem alone
    expect(gstOnJewellery({ metal: 0, making: 0 }, 'weight')).toBe(0);
  });
});

describe('GST policy — offline manual design + order display (no second GST)', () => {
  it('manual / offline fixed amounts: product tax and client estimate stay 0', () => {
    expect(resolveProductTax({ category: 'manual_design' }).rate_percent).toBe(0);
    expect(estimateClientTax([{ price: 9_000, quantity: 1, category: 'manual_design' }], 0)).toBe(0);
  });

  it('stored gst_amount is folded into jewellery line once — no extra GST row', () => {
    const metal = 8_000;
    const jewelry = 2_000;
    const gst = Math.round(gstOnAmount(metal + jewelry, GST_METAL_MOUNTED_PERCENT));
    expect(gst).toBe(300);

    const lines = buildOrderPriceLines({
      subtotal: 40_000,
      metal_charges: metal,
      jewelry_charges: jewelry,
      certification_charges: 4_000,
      energization_charges: 2_000,
      shipping_cost: 1_500,
      gst_amount: gst,
      total: 40_000 + metal + jewelry + 4_000 + 2_000 + 1_500 + gst,
    });

    expect(lines.find((l) => l.key === 'gst')).toBeUndefined();
    expect(lines.find((l) => l.key === 'jewelry')?.amount).toBe(metal + jewelry + gst);

    const sum = lines.reduce((s, l) => s + l.sign * l.amount, 0);
    expect(sum).toBe(40_000 + metal + jewelry + gst + 4_000 + 2_000 + 1_500);
  });

  it('India vs international: same weight GST amount; split CGST/SGST vs IGST only', () => {
    const taxable = 100_000;
    const expected = Math.round(gstOnAmount(taxable, GST_METAL_MOUNTED_PERCENT));

    const delhi = buildTaxBreakdown('Delhi', [
      calculateGstComponent({
        label: 'Jewellery (weight + labour %)',
        component: 'metal',
        amount: taxable,
        ratePercent: GST_METAL_MOUNTED_PERCENT,
        destinationState: 'Delhi',
      }),
    ]);
    const us = buildTaxBreakdown('California', [
      calculateGstComponent({
        label: 'Jewellery (weight + labour %)',
        component: 'metal',
        amount: taxable,
        ratePercent: GST_METAL_MOUNTED_PERCENT,
        destinationState: 'California',
      }),
    ]);

    expect(getTaxJurisdiction('Delhi')).toBe('intra_state');
    expect(getTaxJurisdiction('California')).toBe('inter_state');
    expect(Math.round(delhi.totals.gst_amount)).toBe(expected);
    expect(Math.round(us.totals.gst_amount)).toBe(expected);
    expect(delhi.totals.igst).toBe(0);
    expect(us.totals.igst).toBe(expected);
  });
});

describe('GST policy — weight path never double-applies 3%', () => {
  it('gstOnJewellery(weight) === gstOnAmount(base, 3); fixed always 0', () => {
    const parts = { metal: 50_000, making: 12_500, diamond: 5_000, custom: 1_000 };
    const base = 50_000 + 12_500 + 5_000 + 1_000;
    expect(gstOnJewellery(parts, 'weight')).toBe(gstOnAmount(base, 3));
    expect(gstOnJewellery(parts, 'fixed')).toBe(0);
    expect(gstOnJewellery(parts, null)).toBe(0);
  });

  it('DB making_charge that already folds diamond is not double-counted with snap diamond', () => {
    // Snapshot path (separate fields) — preferred when present
    const fromSnap = weightJewelleryTaxableFromConfig({
      snapshotPricing: {
        jewelry_pricing_mode: 'weight',
        metal_weight_grams: 5,
        metal_price: 10_000,
        making_charge: 2_500,
        diamond_charge: 1_000,
        custom_design_fee: 0,
      },
      db: {
        metal_price: 10_000,
        making_charge: 3_500, // folded 2500+1000 — must NOT be used when snap has parts
        custom_design_fee: 0,
      },
    });
    expect(fromSnap.taxable).toBe(13_500);

    // DB-only path
    const fromDb = weightJewelleryTaxableFromConfig({
      snapshotPricing: {
        jewelry_pricing_mode: 'weight',
        metal_weight_grams: 5,
        metal_price: null,
        making_charge: null,
        diamond_charge: null,
        custom_design_fee: null,
      },
      db: { metal_price: 10_000, making_charge: 3_500, custom_design_fee: 0 },
    });
    expect(fromDb.taxable).toBe(13_500);
  });
});
