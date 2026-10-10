import { describe, expect, it } from 'vitest';
import { matchBlogRedirectSlug } from '@/lib/blog/slug-redirect';

const current = 'शारदीय-नवरात्रि-कलश-स्थापना-विधि-(Kalash-Sthapna-Vidhi)';
const posts = [
  { slug: 'ruby-benefits', title: 'Benefits of Ruby' },
  {
    slug: current,
    title: 'नवरात्रि में घट या कलश स्थापना कैसे करें?',
    previousSlugs: ['चैत्र-नवरात्रि-कलश-स्थापना-विधि-(Kalash-Sthapna-Vidhi)'],
  },
];

describe('matchBlogRedirectSlug', () => {
  it('redirects title-style, renamed and WP-truncated URLs to the current slug', () => {
    expect(matchBlogRedirectSlug('नवरात्रि-में-घट-या-कलश-स्थापना-कैसे-करें', posts)).toBe(current);
    expect(matchBlogRedirectSlug('चैत्र-नवरात्रि-कलश-स्थापना-विधि-(Kalash-Sthapna-Vidhi)', posts)).toBe(current);
    expect(matchBlogRedirectSlug('चैत्र-नवरात्रि-कलश-स्थाप', posts)).toBe(current);
    expect(matchBlogRedirectSlug('benefits-of-ruby', posts)).toBe('ruby-benefits');
  });

  it('does not guess on short or unrelated URLs', () => {
    expect(matchBlogRedirectSlug('ruby', posts)).toBeNull();
    expect(matchBlogRedirectSlug('some-unrelated-article-title', posts)).toBeNull();
  });
});
