import { describe, expect, it } from 'vitest';
import { demoteBodyH1s, stripHtmlVideos } from '@/lib/utils/html-headings';

describe('demoteBodyH1s', () => {
  it('keeps CMS body headings below the product page H1', () => {
    expect(demoteBodyH1s('<h1 id="legacy-title">Stone details</h1><p>Body</p>')).toBe(
      '<h2 id="legacy-title">Stone details</h2><p>Body</p>',
    );
  });
});

describe('stripHtmlVideos', () => {
  it('removes youtube iframe embeds from description html', () => {
    const html =
      '<p>Natural ruby.</p><h3>Ratna Abhishek</h3><iframe src="https://www.youtube.com/embed/abc"></iframe><p>More.</p>';
    expect(stripHtmlVideos(html)).toBe(
      '<p>Natural ruby.</p><h3>Ratna Abhishek</h3><p>More.</p>',
    );
  });
});
