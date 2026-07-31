import { describe, expect, it } from 'vitest';
import { buildConfiguratorPriceTotals } from '@/lib/utils/configurator-pricing-display';
import type { ConfigPricingBreakdown } from '@/lib/types/configurator';
import { gstOnAmount } from '@/lib/utils/tax';

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
  it('breaks down fixed silver ring with diamond add-on and component GST', () => {
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
      'Making charge (fixed)',
      'Diamond add-on',
      'Certification',
    ]);
    expect(totals.pre_gst_subtotal).toBe(42930);
    // metal 0; making+diamond 24500 @ 5% = 1225; gem 18430 @ 0.25% = 46.075 → 46.08
    expect(totals.gst_metal).toBe(0);
    expect(totals.gst_making).toBe(1225);
    expect(totals.gst_jewelry).toBe(1225);
    expect(totals.gst_gemstone).toBe(gstOnAmount(18430, 0.25));
    expect(totals.gst_total).toBe(Math.round(1225 + gstOnAmount(18430, 0.25)));
    expect(totals.grand_total).toBe(42930 + totals.gst_total);
  });

  it('breaks down weight-based gold with labor at metal 3% / making 5%', () => {
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

    const laborLine = totals.lines.find((l) => l.key === 'labor');
    expect(laborLine?.label).toBe('Labor charge');
    expect(laborLine?.amount).toBe(6000);
    expect(totals.gst_metal).toBe(720);
    expect(totals.gst_making).toBe(300);
    expect(totals.gst_jewelry).toBe(1020);
    expect(totals.gst_gemstone).toBe(25);
    expect(totals.grand_total).toBe(41045);
  });

  it('matches checkout component GST rates for configured ring', () => {
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
    expect(totals.gst_gemstone).toBe(gstOnAmount(15048, 0.25)); // 37.62
    expect(totals.gst_metal).toBe(1239);
    expect(totals.gst_making).toBe(516.25);
    expect(totals.gst_certification).toBe(0);
    expect(totals.gst_energization).toBe(0);
    expect(totals.gst_total).toBe(
      Math.round(37.62 + 1239 + 516.25),
    ); // 1793
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
    const noteLine = totals.lines.find((l) => l.key === 'design-note');
    expect(noteLine?.display).toContain('small stones');
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
  });
});
