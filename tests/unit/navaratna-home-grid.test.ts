import { describe, expect, it } from 'vitest';
import {
  NAVARATNA_HOME_GRID_SLUGS,
  pickNavaratnaHomeGridCategories,
} from '@/lib/constants/navaratna-home-grid';

describe('navaratna homepage grid', () => {
  it('includes pitambari as the tenth homepage card', () => {
    const items = NAVARATNA_HOME_GRID_SLUGS.slice(0, 9).map((slug, index) => ({
      slug,
      name: slug,
      featured_on_homepage: true,
      sort_order: index + 1,
    }));

    const fallback = new Map([
      ['pitambari', { slug: 'pitambari', name: 'Pitambari', featured_on_homepage: true, sort_order: 10 }],
    ]);

    const picked = pickNavaratnaHomeGridCategories(items, fallback);

    expect(picked).toHaveLength(10);
    expect(picked.at(-1)?.slug).toBe('pitambari');
  });

  it('respects admin homepage visibility', () => {
    const items = NAVARATNA_HOME_GRID_SLUGS.map((slug, index) => ({
      slug,
      name: slug,
      featured_on_homepage: slug !== 'pitambari',
      sort_order: index + 1,
    }));

    const picked = pickNavaratnaHomeGridCategories(items, new Map());

    expect(picked.some((item) => item.slug === 'pitambari')).toBe(false);
    expect(picked).toHaveLength(9);
  });
});
