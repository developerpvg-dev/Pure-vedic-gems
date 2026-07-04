import { describe, expect, it } from 'vitest';
import {
  qualityTierFilterLabels,
  resolveQualityTier,
} from '@/lib/utils/quality-tier';

describe('resolveQualityTier', () => {
  it('maps legacy Best label to Premium', () => {
    expect(resolveQualityTier('Best')).toBe('Premium');
  });

  it('maps typo Laxury labels to Luxury', () => {
    expect(resolveQualityTier('Laxury')).toBe('Luxury');
    expect(resolveQualityTier('Super Laxury')).toBe('Super Luxury');
  });

  it('extracts tier from product title when quality_label is missing', () => {
    expect(resolveQualityTier(null, 'Opal 5.2ct. (Luxury)')).toBe('Luxury');
    expect(resolveQualityTier('Good', 'Moonstone 3ct. (Premium)')).toBe('Good');
  });

  it('maps Super Premium in title to Super Luxury', () => {
    expect(resolveQualityTier(null, 'White Sapphire 5.16ct. (Super Premium)')).toBe('Super Luxury');
  });
});

describe('qualityTierFilterLabels', () => {
  it('includes legacy aliases for Premium filter matching', () => {
    const labels = qualityTierFilterLabels('Premium');
    expect(labels).toContain('Premium');
    expect(labels).toContain('Best');
  });

  it('includes typo variants for Luxury filter matching', () => {
    const labels = qualityTierFilterLabels('Luxury');
    expect(labels).toContain('Luxury');
    expect(labels).toContain('Laxury');
  });
});
