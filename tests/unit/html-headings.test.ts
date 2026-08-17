import { describe, expect, it } from 'vitest';
import { demoteBodyH1s } from '@/lib/utils/html-headings';

describe('demoteBodyH1s', () => {
  it('keeps CMS body headings below the product page H1', () => {
    expect(demoteBodyH1s('<h1 id="legacy-title">Stone details</h1><p>Body</p>')).toBe(
      '<h2 id="legacy-title">Stone details</h2><p>Body</p>',
    );
  });
});
