import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PortableText } from '@/components/blog/PortableText';

describe('blog PortableText headings', () => {
  it('demotes body H1s and removes links from headings', () => {
    const html = renderToStaticMarkup(
      createElement(PortableText, {
        value: [
          {
            _type: 'block',
            style: 'h1',
            children: [{ _type: 'span', _key: 'heading', text: 'Emerald Guide', marks: ['link'] }],
            markDefs: [{ _key: 'link', _type: 'link', href: '/shop/emerald' }],
          },
        ],
      }),
    );

    expect(html).toContain('<h2 id="emerald-guide">');
    expect(html).not.toContain('<h1');
    expect(html).not.toContain('<a ');
  });
});
