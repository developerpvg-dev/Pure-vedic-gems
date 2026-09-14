import { describe, expect, it } from 'vitest';
import {
  NAVARATNA_HOME_GRID_SLUGS,
  pickNavaratnaHomeGridCategories,
} from '@/lib/constants/navaratna-home-grid';

describe('navaratna homepage grid', () => {
  it('includes padparadscha after pitambari on the homepage grid', () => {
    const items = NAVARATNA_HOME_GRID_SLUGS.slice(0, -1).map((slug, index) => ({
      slug,
      name: slug,
      featured_on_homepage: true,
      sort_order: index + 1,
    }));

    const fallback = new Map([
      [
        'padparadscha-sapphire',
        {
          slug: 'padparadscha-sapphire',
          name: 'Padparadscha Sapphire',
          featured_on_homepage: true,
          sort_order: 11,
        },
      ],
    ]);

    const picked = pickNavaratnaHomeGridCategories(items, fallback);

    expect(picked).toHaveLength(NAVARATNA_HOME_GRID_SLUGS.length);
    expect(picked.at(-1)?.slug).toBe('padparadscha-sapphire');
  });

  it('respects admin homepage visibility', () => {
    const items = NAVARATNA_HOME_GRID_SLUGS.map((slug, index) => ({
      slug,
      name: slug,
      featured_on_homepage: slug !== 'padparadscha-sapphire',
      sort_order: index + 1,
    }));

    const picked = pickNavaratnaHomeGridCategories(items, new Map());

    expect(picked.some((item) => item.slug === 'padparadscha-sapphire')).toBe(false);
    expect(picked).toHaveLength(NAVARATNA_HOME_GRID_SLUGS.length - 1);
  });
});
