import { describe, expect, it } from 'vitest';
import { payloadSlug, sanityRevalidatePaths } from '@/lib/sanity/webhook-paths';

describe('sanityRevalidatePaths', () => {
  it('busts every blog post page even when slug is missing', () => {
    expect(sanityRevalidatePaths('blogPost')).toContain('/blog/[slug]');
    expect(sanityRevalidatePaths('blog-post')).toContain('/blog/[slug]');
  });

  it('maps hyphenated knowledge types from the setup guide', () => {
    expect(sanityRevalidatePaths('knowledge-article')).toContain('/knowledge/[slug]');
  });

  it('reads slug.current or a string slug', () => {
    expect(payloadSlug({ slug: { current: 'neelam-guide' } })).toBe('neelam-guide');
    expect(payloadSlug({ slug: 'neelam-guide' })).toBe('neelam-guide');
  });
});
