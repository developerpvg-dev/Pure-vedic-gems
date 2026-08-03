import { describe, expect, it } from 'vitest';
import {
  buildTaxBreakdown,
  calculateGstComponent,
  estimateClientTax,
  getTaxJurisdiction,
  gstOnAmount,
  gstOnJewellery,
  isMetalMounted,
  resolveGemOrBeadTaxRate,
  resolveProductTax,
} from '@/lib/utils/tax';
import { calculateJewelryDesignPricing } from '@/lib/utils/jewelry-pricing';
import { resolveLaborRatePercent } from '@/lib/utils/metal-pricing-config';
import { resolveLaborRatesForJewelry } from '@/lib/utils/jewelry-setting-metal-profiles';
import { buildConfiguratorPriceTotals } from '@/lib/utils/configurator-pricing-display';
import type { ConfigPricingBreakdown } from '@/lib/types/configurator';

describe('tax helpers', () => {
  it('resolves explicit product GST overrides before category defaults', () => {
    expect(resolveProductTax({ category: 'Ruby Gemstone', gst_rate: '5', hsn_code: '7103' })).toMatchObject({
      rate_percent: 5,
      hsn_code: '7103',
      tax_class: 'product_override',
    });
  });

  it('splits GST into CGST and SGST for seller-state deliveries', () => {
    const component = calculateGstComponent({
      label: 'Making charge',
      component: 'making_charge',
      amount: 1000,
      ratePercent: 18,
      destinationState: 'Delhi',
    });

    expect(getTaxJurisdiction('Delhi')).toBe('intra_state');
    expect(component).toMatchObject({ cgst: 90, sgst: 90, igst: 0, total_tax: 180 });
  });

  it('uses IGST for inter-state deliveries and totals all components', () => {
    const product = calculateGstComponent({
      label: 'Gemstone',
      component: 'product',
      amount: 20000,
      ratePercent: 0.25,
      destinationState: 'Maharashtra',
    });
    const shipping = calculateGstComponent({
      label: 'Shipping',
      component: 'shipping',
      amount: 250,
      ratePercent: 18,
      destinationState: 'Maharashtra',
    });

    const breakdown = buildTaxBreakdown('Maharashtra', [product, shipping]);

    expect(breakdown.jurisdiction).toBe('inter_state');
    expect(breakdown.totals).toMatchObject({ taxable_amount: 20250, cgst: 0, sgst: 0, igst: 95, gst_amount: 95 });
  });

  it('applies business GST rate table', () => {
    expect(resolveProductTax({ category: 'Ruby' }).rate_percent).toBe(0.25);
    expect(resolveProductTax({ category: 'navaratna' }).rate_percent).toBe(0.25);
    expect(resolveProductTax({ category: 'gemstone' }).rate_percent).toBe(0.25);
    expect(resolveProductTax({ category: 'rudraksha' }).rate_percent).toBe(0);
    expect(resolveProductTax({ category: 'mala' }).rate_percent).toBe(0);
    expect(resolveProductTax({ category: 'idol' }).rate_percent).toBe(0);
    expect(resolveProductTax({ category: 'jewelry' }).rate_percent).toBe(3);
    expect(resolveGemOrBeadTaxRate('Ruby', false)).toBe(0.25);
    expect(resolveGemOrBeadTaxRate('Ruby', true)).toBe(3);
    expect(isMetalMounted({ metal: 100 })).toBe(true);
    expect(isMetalMounted({ making: 50 })).toBe(true);
    expect(isMetalMounted({})).toBe(false);
  });

  it('charges 0.25% on plain loose navaratna stone (no jewellery config)', () => {
    const gst = estimateClientTax(
      [{ price: 99930, quantity: 1, category: 'navaratna' }],
      0,
    );
    expect(gst).toBe(Math.round(gstOnAmount(99930, 0.25)));
    expect(gst).toBe(250);
  });

  it('charges one 3% GST on (gem + metal + labour) for jewellery — including fixed making', () => {
    // Cart screenshot case: gem 130645 + fixed mounting 10000; puja exempt
    const gst = estimateClientTax(
      [
        {
          price: 142745,
          quantity: 1,
          category: 'Ruby',
          configuration_snapshot: {
            product: { category: 'Ruby' },
            pricing: {
              gem_price: 130645,
              metal_price: 0,
              making_charge: 10000,
              diamond_charge: 0,
              certification_fee: 0,
              energization_fee: 2100,
              custom_design_fee: 0,
              jewelry_pricing_mode: 'fixed',
              total: 142745,
            },
          },
        },
      ],
      0,
    );

    expect(gst).toBe(Math.round(gstOnJewellery({ gem: 130645, making: 10000 })));
    expect(gst).toBe(4219);
  });

  it('charges one 3% on gem+metal+labour+diamond together', () => {
    const gst = estimateClientTax(
      [
        {
          price: 74173,
          quantity: 1,
          category: 'Ruby',
          configuration_snapshot: {
            product: { category: 'Ruby' },
            pricing: {
              gem_price: 15048,
              metal_price: 41300,
              making_charge: 10325,
              diamond_charge: 0,
              certification_fee: 4000,
              energization_fee: 3500,
              custom_design_fee: 0,
              total: 74173,
            },
          },
        },
      ],
      1500,
    );

    const expected = Math.round(
      gstOnAmount(15048 + 41300 + 10325, 3) + gstOnAmount(1500, 18),
    );
    expect(gst).toBe(expected);
  });

  it('applies loose rudraksha 0% and metal-mounted rudraksha 3% once on bead+metal+labour', () => {
    expect(estimateClientTax([{ price: 500, quantity: 1, category: 'rudraksha' }], 0)).toBe(0);

    const gst = estimateClientTax(
      [
        {
          price: 199.47,
          quantity: 1,
          category: 'rudraksha',
          configuration_snapshot: {
            product: { category: 'rudraksha' },
            pricing: {
              gem_price: 18.82,
              metal_price: 150.45,
              making_charge: 30.2,
              diamond_charge: 0,
              certification_fee: 0,
              energization_fee: 0,
              custom_design_fee: 0,
              total: 199.47,
            },
          },
        },
      ],
      0,
    );

    expect(gst).toBe(Math.round(gstOnJewellery({ gem: 18.82, metal: 150.45, making: 30.2 })));
  });

  it('keeps loose stone at 0.25% when no metal/making', () => {
    const gst = estimateClientTax(
      [
        {
          price: 20000,
          quantity: 1,
          category: 'gemstone',
          configuration_snapshot: {
            product: { category: 'gemstone' },
            pricing: {
              gem_price: 20000,
              metal_price: 0,
              making_charge: 0,
              diamond_charge: 0,
              certification_fee: 0,
              energization_fee: 0,
              custom_design_fee: 0,
              total: 20000,
            },
          },
        },
      ],
      0,
    );
    expect(gst).toBe(Math.round(gstOnAmount(20000, 0.25)));
  });

  it('applies 3% on ready diamond/jewellery products', () => {
    expect(estimateClientTax([{ price: 50000, quantity: 1, category: 'jewelry' }], 0)).toBe(
      Math.round(gstOnAmount(50000, 3)),
    );
  });
});

describe('labor FIXED vs % end-to-end with GST', () => {
  it('fixed making from design sheet (silver) — one 3% on gem+making+diamond', () => {
    const jewelry = calculateJewelryDesignPricing({
      metal: 'silver_925',
      makingCharges: { silver_925: 8500 },
      estimatedMetalWeight: { gold_18k: 5 },
      diamondCharges: { silver_925: 2000 },
      metalRatePerGram: 100,
      laborRates: { gold_18k: 25 },
    });

    const pricing: ConfigPricingBreakdown = {
      gem_price: 20000,
      making_charge: jewelry.makingCharge,
      diamond_charge: jewelry.diamondCharge,
      stone_addon_label: 'Diamond',
      design_note: null,
      metal_price: jewelry.metalPrice,
      metal_weight_grams: jewelry.metalWeightGrams,
      gold_rate_per_gram: 0,
      labor_rate_percent: jewelry.laborRatePercent,
      jewelry_pricing_mode: 'fixed',
      certification_fee: 0,
      energization_fee: 0,
      custom_design_fee: 0,
      total: 20000 + 8500 + 2000,
    };

    const totals = buildConfiguratorPriceTotals(pricing, {
      settingType: 'ring',
      productCategory: 'gemstone',
    });

    expect(totals.pre_gst_subtotal).toBe(30500);
    expect(totals.gst_jewelry).toBe(gstOnJewellery({ gem: 20000, making: 8500, diamond: 2000 }));
    expect(totals.gst_gemstone).toBe(0);
    expect(totals.gst_metal).toBe(0);
    expect(totals.gst_making).toBe(0);
  });

  it('weight metal + design labor % — labor = metal × %', () => {
    const jewelry = calculateJewelryDesignPricing({
      metal: 'gold_18k',
      makingCharges: {},
      estimatedMetalWeight: { gold_18k: 7 },
      diamondCharges: {},
      metalRatePerGram: 5900,
      laborRates: { gold_18k: 25 },
    });

    expect(jewelry.pricingKind).toBe('weight');
    expect(jewelry.metalPrice).toBe(41300);
    expect(jewelry.makingCharge).toBe(10325);
    expect(jewelry.laborRatePercent).toBe(25);
  });

  it('design labor_rates override profile and sheet defaults', () => {
    const rates = resolveLaborRatesForJewelry(
      'ring',
      { labor_rates: { gold_18k: 15 }, product_scope: 'gemstone' },
      {
        gemstone: {
          ring: {
            default_gst_percent: 3,
            labor_rates: { gold_18k: 25 },
            gst_rates: {},
          },
        },
      },
    );
    expect(rates.gold_18k).toBe(15);

    const jewelry = calculateJewelryDesignPricing({
      metal: 'gold_18k',
      makingCharges: {},
      estimatedMetalWeight: { gold_18k: 10 },
      metalRatePerGram: 5000,
      laborRates: rates,
    });
    expect(jewelry.metalPrice).toBe(50000);
    expect(jewelry.makingCharge).toBe(7500);
  });

  it('empty profile still uses sheet default labor % (not silent zero)', () => {
    expect(resolveLaborRatePercent('gold_22k', {})).toBe(20);
    expect(resolveLaborRatePercent('gold_18k', {})).toBe(25);
    expect(resolveLaborRatePercent('gold_22k', { gold_22k: 0 })).toBe(0);

    const rates = resolveLaborRatesForJewelry('ring', null, null);
    expect(rates.gold_18k).toBe(25);
    expect(rates.gold_22k).toBe(20);
  });

  it('client GST estimate matches one jewellery 3% for weight + diamond', () => {
    const jewelry = calculateJewelryDesignPricing({
      metal: 'gold_18k',
      makingCharges: {},
      estimatedMetalWeight: { gold_18k: 5 },
      diamondCharges: { gold_18k: 17500 },
      metalRatePerGram: 6000,
      laborRates: { gold_18k: 25 },
    });

    const gem = 18430;
    const cert = 4000;
    const snapshotPricing = {
      gem_price: gem,
      metal_price: jewelry.metalPrice,
      making_charge: jewelry.makingCharge,
      diamond_charge: jewelry.diamondCharge,
      certification_fee: cert,
      energization_fee: 0,
      custom_design_fee: 0,
      total: gem + jewelry.metalPrice + jewelry.makingCharge + jewelry.diamondCharge + cert,
    };

    const display = buildConfiguratorPriceTotals(
      {
        ...snapshotPricing,
        stone_addon_label: 'Diamond',
        design_note: null,
        metal_weight_grams: 5,
        gold_rate_per_gram: 6000,
        labor_rate_percent: 25,
        jewelry_pricing_mode: 'weight',
      },
      { settingType: 'ring', productCategory: 'gemstone' },
    );

    const clientGst = estimateClientTax(
      [
        {
          price: snapshotPricing.total,
          quantity: 1,
          category: 'gemstone',
          configuration_snapshot: { product: { category: 'gemstone' }, pricing: snapshotPricing },
        },
      ],
      0,
    );

    const serverGst = Math.round(
      gstOnJewellery({
        gem,
        metal: jewelry.metalPrice,
        making: jewelry.makingCharge,
        diamond: jewelry.diamondCharge,
      }),
    );

    expect(display.gst_total).toBe(serverGst);
    expect(clientGst).toBe(serverGst);
  });
});
