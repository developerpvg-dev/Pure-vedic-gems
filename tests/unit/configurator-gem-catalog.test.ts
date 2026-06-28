import { describe, expect, it } from 'vitest';
import {
  isConfiguratorGemCatalogScope,
  isGemConfiguratorEnabled,
} from '@/lib/shop/configurator';

describe('configurator gem catalog scope', () => {
  it('treats navaratna ruby scope as catalog browsing', () => {
    expect(isConfiguratorGemCatalogScope('navaratna', 'ruby')).toBe(true);
    expect(isConfiguratorGemCatalogScope('ruby')).toBe(true);
  });

  it('does not treat rudraksha as gem catalog browsing', () => {
    expect(isConfiguratorGemCatalogScope('rudraksha', '1-mukhi')).toBe(false);
  });

  it('enables configurator for navaratna products without per-SKU flag', () => {
    expect(isGemConfiguratorEnabled('navaratna', false)).toBe(true);
    expect(isGemConfiguratorEnabled('gemstone', false)).toBe(false);
  });
});
