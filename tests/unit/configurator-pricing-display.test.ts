import { describe, expect, it } from 'vitest';
import { buildConfiguratorPriceTotals } from '@/lib/utils/configurator-pricing-display';
import type { ConfigPricingBreakdown } from '@/lib/types/configurator';

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
  it('breaks down fixed silver ring with diamond add-on and GST', () => {
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
      jewelryGstPercent: 3,
    });

    expect(totals.lines.map((l) => l.label)).toEqual([
      'Gemstone',
      'Making charge (fixed)',
      'Diamond add-on',
      'Certification',
    ]);
    expect(totals.pre_gst_subtotal).toBe(42930);
    expect(totals.gst_jewelry).toBe(735); // 3% of 24500
    expect(totals.gst_gemstone).toBe(46); // 0.25% of 18430
    expect(totals.grand_total).toBe(43711);
  });

  it('breaks down weight-based gold with labor', () => {
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
      jewelryGstPercent: 3,
    });

    const laborLine = totals.lines.find((l) => l.key === 'labor');
    expect(laborLine?.label).toBe('Labor charge');
    expect(laborLine?.amount).toBe(6000);
    expect(totals.gst_jewelry).toBe(900); // 3% of 30000
    expect(totals.grand_total).toBe(40925); // 40000 + 900 + 25 gem gst
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
});
