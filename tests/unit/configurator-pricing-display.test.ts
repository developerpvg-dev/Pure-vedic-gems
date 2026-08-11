import { describe, expect, it } from 'vitest';
import { buildConfiguratorPriceTotals } from '@/lib/utils/configurator-pricing-display';
import type { ConfigPricingBreakdown } from '@/lib/types/configurator';
import { gstOnJewellery } from '@/lib/utils/tax';

const basePricing: ConfigPricingBreakdown = {
  gem_price: 0,
  making_charge: 0,
  diamond_charge: 0,
  stone_addon_label: null,
  design_note: null,
  metal_price: 0,
  metal_weight_grams: 0,
  gold_rate_per_gram: 0,
  labor_rate_percent: 0,
  jewelry_pricing_mode: null,
  certification_fee: 0,
  energization_fee: 0,
  custom_design_fee: 0,
  total: 0,
};

describe('buildConfiguratorPriceTotals', () => {
  it('fixed sheet: no auto GST; amounts shown as entered', () => {
    const pricing: ConfigPricingBreakdown = {
      ...basePricing,
      gem_price: 18430,
      making_charge: 7000,
      diamond_charge: 17500,
      stone_addon_label: 'Diamond',
      jewelry_pricing_mode: 'fixed',
      total: 42930,
    };

    const totals = buildConfiguratorPriceTotals(pricing, {
      settingType: 'ring',
      productCategory: 'gemstone',
    });

    expect(totals.lines.map((l) => l.label)).toEqual([
      'Gemstone',
      'Est. mounting',
      'Diamond add-on',
      'Certification',
    ]);
    expect(totals.lines.find((l) => l.key === 'est-mounting')?.amount).toBe(7000);
    expect(totals.lines.find((l) => l.key === 'stone-addon')?.amount).toBe(17500);
    expect(totals.pre_gst_subtotal).toBe(42930);
    expect(totals.gst_jewelry).toBe(0);
    expect(totals.gst_gemstone).toBe(0);
    expect(totals.gst_metal).toBe(0);
    expect(totals.gst_making).toBe(0);
    expect(totals.gst_total).toBe(0);
    expect(totals.grand_total).toBe(42930);
  });

  it('uses 3% on metal+labour only (not gem) for weight-based gold', () => {
    const pricing: ConfigPricingBreakdown = {
      ...basePricing,
      gem_price: 10000,
      metal_price: 24000,
      metal_weight_grams: 5,
      gold_rate_per_gram: 4800,
      making_charge: 6000,
      labor_rate_percent: 25,
      jewelry_pricing_mode: 'weight',
      total: 40000,
    };

    const totals = buildConfiguratorPriceTotals(pricing, {
      settingType: 'ring',
      productCategory: 'gemstone',
    });

    const expected = gstOnJewellery({ metal: 24000, making: 6000 }, 'weight');
    expect(totals.gst_jewelry).toBe(expected);
    expect(totals.gst_gemstone).toBe(0);
    expect(totals.gst_total).toBe(Math.round(expected));
    expect(totals.grand_total).toBe(40000 + totals.gst_total);
    // Mounting is tax-inclusive for weight mode; never a separate "GST" line.
    expect(totals.lines.find((l) => l.key === 'est-mounting')?.amount).toBe(
      Math.round(30000 + expected),
    );
    expect(totals.lines.find((l) => l.key === 'gst')).toBeUndefined();
    expect(totals.lines.every((l) => !/gst/i.test(l.label))).toBe(true);
  });

  it('matches checkout jewellery-only GST for configured ring', () => {
    const pricing: ConfigPricingBreakdown = {
      ...basePricing,
      gem_price: 15048,
      metal_price: 41300,
      making_charge: 10325,
      metal_weight_grams: 7,
      gold_rate_per_gram: 5900,
      labor_rate_percent: 25,
      jewelry_pricing_mode: 'weight',
      certification_fee: 4000,
      energization_fee: 3500,
      total: 74173,
    };

    const totals = buildConfiguratorPriceTotals(pricing, {
      settingType: 'ring',
      productCategory: 'Ruby',
    });

    expect(totals.pre_gst_subtotal).toBe(74173);
    const expected = Math.round(gstOnJewellery({ metal: 41300, making: 10325 }, 'weight'));
    expect(totals.gst_jewelry).toBe(expected);
    expect(totals.gst_certification).toBe(0);
    expect(totals.gst_energization).toBe(0);
    expect(totals.gst_total).toBe(expected);
  });

  it('shows diamond add-on before metal is chosen and design note for remark-only designs', () => {
    const pricing: ConfigPricingBreakdown = {
      ...basePricing,
      gem_price: 50000,
      diamond_charge: 17500,
      stone_addon_label: 'Diamond',
      design_note:
        'The price of the small stones to be used around the centre big depends on quality.',
      total: 67500,
    };

    const totals = buildConfiguratorPriceTotals(pricing, {
      settingType: 'ring',
      productCategory: 'gemstone',
    });

    expect(totals.lines.map((l) => l.key)).toContain('stone-addon');
    expect(totals.lines.map((l) => l.key)).toContain('design-note');
    // No weight mode → no auto GST on diamond alone
    expect(totals.gst_jewelry).toBe(0);
  });

  it('shows TBD mounting line when custom design pricing is pending', () => {
    const pricing: ConfigPricingBreakdown = {
      ...basePricing,
      gem_price: 20000,
      custom_design_pricing_pending: true,
      total: 20000,
    };
    const totals = buildConfiguratorPriceTotals(pricing, {
      settingType: 'ring',
      productCategory: 'gemstone',
    });
    expect(totals.lines.some((l) => l.key === 'custom-design-pending')).toBe(true);
    expect(totals.lines.find((l) => l.key === 'custom-design-pending')?.display).toBe('TBD');
    // No metal/making yet → gem never taxed
    expect(totals.gst_jewelry).toBe(0);
    expect(totals.gst_gemstone).toBe(0);
  });
});
