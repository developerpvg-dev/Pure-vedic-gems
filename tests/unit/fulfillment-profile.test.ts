import { describe, expect, it } from 'vitest';
import {
  getAdminStatusPipeline,
  getJourneyStepsForContext,
  resolveLineItemFulfillmentProfile,
  resolveOrderFulfillmentContext,
} from '@/lib/orders/fulfillment-profile';
import { getCustomerJourney } from '@/lib/orders/customer-journey';

describe('fulfillment-profile', () => {
  it('detects loose gemstone configuration', () => {
    const profile = resolveLineItemFulfillmentProfile({
      category: 'gemstone',
      configuration_id: 'cfg-1',
      configuration_snapshot: {
        product: { category: 'gemstone', name: 'Ruby' },
        selections: { setting_type: 'loose' },
      },
    });
    expect(profile).toBe('loose_gemstone');
  });

  it('detects rudraksha configured pendant', () => {
    const profile = resolveLineItemFulfillmentProfile({
      category: 'rudraksha',
      configuration_id: 'cfg-2',
      configuration_snapshot: {
        product: { category: 'rudraksha', name: '5 Mukhi' },
        selections: { setting_type: 'pendant', is_rudraksha: true },
      },
    });
    expect(profile).toBe('rudraksha_configured');
  });

  it('builds shorter journey for loose gemstones without energization', () => {
    const context = resolveOrderFulfillmentContext({
      items: [{ category: 'gemstone', configuration_snapshot: { selections: { setting_type: 'loose' } } }],
      includeEnergization: false,
    });
    const steps = getJourneyStepsForContext(context).map((step) => step.key);
    expect(steps).toEqual([
      'payment',
      'confirmed',
      'processing',
      'product_video',
      'packed',
      'shipped',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'feedback',
    ]);
    expect(context.needsCrafting).toBe(false);
    expect(context.showProductVideo).toBe(true);
  });

  it('includes product video for loose rudraksha', () => {
    const context = resolveOrderFulfillmentContext({
      items: [{ category: 'rudraksha', configuration_snapshot: { selections: { setting_type: 'loose' } } }],
    });
    expect(context.profile).toBe('rudraksha_loose');
    expect(context.showProductVideo).toBe(true);
    expect(getJourneyStepsForContext(context).map((s) => s.key)).toContain('product_video');
  });

  it('includes mounting steps for rudraksha pendants', () => {
    const context = resolveOrderFulfillmentContext({
      items: [{
        category: 'rudraksha',
        configuration_snapshot: { selections: { setting_type: 'pendant', is_rudraksha: true } },
      }],
    });
    const steps = getJourneyStepsForContext(context).map((step) => step.key);
    expect(steps).toContain('crafting');
    expect(steps).toContain('product_video');
    expect(steps).not.toContain('puja_video');
    expect(getAdminStatusPipeline(context)).not.toContain('energization');
  });

  it('uses idol preparation flow for idols', () => {
    const context = resolveOrderFulfillmentContext({
      items: [{ category: 'idol' }],
    });
    const steps = getJourneyStepsForContext(context).map((step) => step.key);
    expect(steps).toContain('preparation');
    expect(steps).not.toContain('crafting');
  });

  it('puts certification before design when paid cert charges exist', () => {
    const context = resolveOrderFulfillmentContext({
      items: [{
        category: 'gemstone',
        configuration_snapshot: { selections: { setting_type: 'ring' } },
      }],
      certificationCharges: 1200,
    });
    expect(context.showCertification).toBe(true);
    const pipeline = getAdminStatusPipeline(context);
    expect(pipeline.indexOf('certification')).toBeLessThan(pipeline.indexOf('design_assigned'));
    const steps = getJourneyStepsForContext(context).map((s) => s.key);
    expect(steps.indexOf('certification')).toBeLessThan(steps.indexOf('crafting'));
  });

  it('skips certification stage for free lab (0 charge)', () => {
    const context = resolveOrderFulfillmentContext({
      items: [{
        category: 'gemstone',
        configuration_snapshot: {
          selections: {
            setting_type: 'ring',
            certification: { name: 'Free Lab' },
          },
        },
      }],
      certificationCharges: 0,
    });
    expect(context.showCertification).toBe(false);
    expect(getAdminStatusPipeline(context)).not.toContain('certification');
    expect(getJourneyStepsForContext(context).map((s) => s.key)).not.toContain('certification');
  });
});

describe('customer-journey', () => {
  it('shows product video milestone for loose gemstone orders', () => {
    const journey = getCustomerJourney({
      status: 'processing',
      payment_status: 'captured',
      items: [{ category: 'gemstone', configuration_snapshot: { selections: { setting_type: 'loose' } } }],
    });
    expect(journey?.milestones.map((m) => m.key)).not.toContain('crafting');
    expect(journey?.milestones.map((m) => m.label)).toContain('Gem Preparation');
    expect(journey?.milestones.map((m) => m.key)).toContain('product_video');
  });

  it('shows pendant mounting for rudraksha configured orders', () => {
    const journey = getCustomerJourney({
      status: 'design_assigned',
      payment_status: 'captured',
      assigned_designer_id: 'designer-1',
      items: [{
        category: 'rudraksha',
        configuration_snapshot: { selections: { setting_type: 'pendant', is_rudraksha: true } },
      }],
    });
    expect(journey?.milestones.some((m) => m.label === 'Pendant Mounting')).toBe(true);
  });

  it('hides Design Routing from configured jewelry customers', () => {
    const journey = getCustomerJourney({
      status: 'design_assigned',
      payment_status: 'captured',
      assigned_designer_id: 'designer-1',
      items: [{
        category: 'gemstone',
        configuration_snapshot: { selections: { setting_type: 'ring' } },
      }],
      certification_charges: 1200,
    });
    const labels = journey?.milestones.map((m) => m.label) ?? [];
    expect(labels).not.toContain('Design Routing');
    expect(labels).toContain('Jewelry Crafting');
    expect(labels).toContain('Certification');
  });

  it('merges energization and puja video into one customer step', () => {
    const journey = getCustomerJourney({
      status: 'confirmed',
      payment_status: 'captured',
      include_energization: true,
      energization_charges: 2100,
      items: [{
        category: 'gemstone',
        configuration_snapshot: { selections: { setting_type: 'ring' } },
      }],
    });
    const keys = journey?.milestones.map((m) => m.key) ?? [];
    expect(keys.filter((k) => k === 'energization')).toHaveLength(1);
    expect(keys).not.toContain('puja_video');
    expect(keys).toContain('energization');
  });
});
