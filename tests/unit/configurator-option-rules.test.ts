import { describe, expect, it } from 'vitest';

import {
  normalizeConfiguratorRules,
  resolveConfiguratorOptionRules,
} from '@/lib/utils/configurator-rules';

describe('resolveConfiguratorOptionRules', () => {
  const looseOnlyRules = normalizeConfiguratorRules({
    product_id: 'prod-1',
    jewelry_design_enabled: false,
    metal_enabled: false,
    allowed_setting_types: ['loose'],
  });

  it('forces pendant design + metal for rudraksha despite loose-only DB rules', () => {
    const rules = resolveConfiguratorOptionRules(
      {
        id: 'prod-1',
        category: 'rudraksha',
        sub_category: '2-mukhi',
        configurator_enabled: false,
      },
      looseOnlyRules
    );

    expect(rules.jewelry_design_enabled).toBe(true);
    expect(rules.metal_enabled).toBe(true);
    expect(rules.allowed_setting_types).toEqual(['pendant']);
    expect(rules.energization_enabled).toBe(false);
    expect(rules.allowed_energization_option_ids).toEqual([]);
  });

  it('keeps loose-only rules for non-rudraksha products with stored rules', () => {
    const rules = resolveConfiguratorOptionRules(
      {
        id: 'prod-2',
        category: 'gemstone',
        sub_category: 'ruby',
        configurator_enabled: false,
      },
      looseOnlyRules
    );

    expect(rules.jewelry_design_enabled).toBe(false);
    expect(rules.allowed_setting_types).toEqual(['loose']);
  });
});
