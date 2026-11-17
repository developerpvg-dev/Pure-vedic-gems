import { describe, expect, it } from 'vitest';
import {
  htmlToApproxMarkdown,
  markdownToPortableText,
  resetPtKeys,
  type PtBlock,
} from '@/lib/babylovegrowth/markdown-to-portable-text';
import {
  articleDocumentId,
  extractFaqs,
  parseBabyLovePayload,
  slugify,
} from '@/lib/babylovegrowth/publish';

describe('babylovegrowth payload', () => {
  it('parses webhook fields and slugifies', () => {
    const payload = parseBabyLovePayload({
      id: 10,
      title: 'Emerald Guide',
      slug: 'Emerald Guide!!',
      metaDescription: 'About emerald',
      content_markdown: '# Emerald Guide\n\nHello **world**',
      faqJsonLd: {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is emerald?',
            acceptedAnswer: { '@type': 'Answer', text: 'A green beryl.' },
          },
        ],
      },
    });
    expect(payload).toMatchObject({
      id: 10,
      title: 'Emerald Guide',
      slug: 'emerald-guide',
      metaDescription: 'About emerald',
    });
    expect(extractFaqs(payload!.faqJsonLd)).toEqual([
      { question: 'What is emerald?', answer: 'A green beryl.' },
    ]);
  });

  it('rejects incomplete payloads', () => {
    expect(parseBabyLovePayload({ title: 'x' })).toBeNull();
    expect(parseBabyLovePayload(null)).toBeNull();
  });

  it('builds deterministic document ids', () => {
    expect(articleDocumentId(151241)).toBe('blg-article-151241');
    expect(slugify('Yellow Sapphire Care')).toBe('yellow-sapphire-care');
  });
});

describe('babylovegrowth markdown → portable text', () => {
  it('converts headings, links, lists and strips duplicate H1', () => {
    resetPtKeys();
    const { blocks, imageUrls } = markdownToPortableText(
      `# Emerald Guide

## Benefits

Wear [natural emerald](https://www.purevedicgems.com/shop/emerald) for Mercury.

- Point one
- Point two

![Gem](https://cdn.example.com/gem.jpg)
`,
      'Emerald Guide',
    );

    expect(imageUrls).toEqual(['https://cdn.example.com/gem.jpg']);
    const styles = blocks.map((b) => ('style' in b ? b.style : b._type));
    expect(styles).toEqual(['h2', 'normal', 'normal', 'normal', 'imageBlock']);

    const para = blocks[1] as PtBlock;
    expect(para.children.some((c) => c.marks.length > 0)).toBe(true);
    expect(para.markDefs[0]?.href).toContain('/shop/emerald');
  });

  it('approx-converts HTML when markdown is absent', () => {
    const md = htmlToApproxMarkdown(
      '<script>bad()</script><h2>Care</h2><p>Use <strong>soft</strong> cloth.</p><ul><li>One</li></ul>',
    );
    expect(md).toContain('## Care');
    expect(md).toContain('**soft**');
    expect(md).toContain('- One');
    expect(md).not.toContain('script');
  });
});
