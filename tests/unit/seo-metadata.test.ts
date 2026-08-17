import { describe, expect, it } from 'vitest';
import { fitDescription, fitTitle } from '@/lib/utils/seo';

describe('SEO metadata limits', () => {
  it('keeps the brand suffix while limiting page titles', () => {
    const title = fitTitle(
      'Blue Sapphire Gemstone Qualities Available in the Market | PureVedicGems',
    );

    expect(title.length).toBeLessThanOrEqual(60);
    expect(title).toMatch(/ \| PureVedicGems$/);
  });

  it('strips markup and limits descriptions without cutting a word', () => {
    const description = fitDescription(`<p>${'Certified gemstone guidance '.repeat(12)}</p>`);

    expect(description.length).toBeLessThanOrEqual(155);
    expect(description).not.toContain('<p>');
    expect(description).not.toMatch(/\s$/);
  });
});
