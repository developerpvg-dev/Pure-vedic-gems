import { describe, expect, it } from 'vitest';

import {
  defaultConfigurableRudrakshaOptionRules,
  withConfigurableRudrakshaEnergizationDefaults,
} from '@/lib/utils/rudraksha-configurator';

describe('configurable rudraksha energization defaults', () => {
  it('builds energization-on rules for new configurable products', () => {
    const rules = defaultConfigurableRudrakshaOptionRules(['e1', 'e2'], ['lab-1']);
    expect(rules.energization_enabled).toBe(true);
    expect(rules.allowed_energization_option_ids).toEqual(['e1', 'e2']);
    expect(rules.allowed_setting_types).toEqual(['pendant', 'loose']);
  });

  it('fills missing option_rules on create', () => {
    const filled = withConfigurableRudrakshaEnergizationDefaults(null, ['e1']);
    expect(filled?.energization_enabled).toBe(true);
    expect(filled?.allowed_energization_option_ids).toEqual(['e1']);
  });

  it('fills empty allow-list when energization was left unset/falsey but not explicit off with payload', () => {
    const filled = withConfigurableRudrakshaEnergizationDefaults(
      { energization_enabled: undefined, allowed_energization_option_ids: [] },
      ['e1'],
    );
    expect(filled?.energization_enabled).toBe(true);
    expect(filled?.allowed_energization_option_ids).toEqual(['e1']);
  });

  it('respects explicit energization_enabled: false', () => {
    const kept = withConfigurableRudrakshaEnergizationDefaults(
      { energization_enabled: false, allowed_energization_option_ids: [] },
      ['e1'],
    );
    expect(kept?.energization_enabled).toBe(false);
    expect(kept?.allowed_energization_option_ids).toEqual([]);
  });
});
