import { describe, expect, it } from 'vitest';
import { buildTaxBreakdown, calculateGstComponent, getTaxJurisdiction, resolveProductTax } from '@/lib/utils/tax';

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
});