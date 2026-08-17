import { describe, expect, it } from 'vitest';
import { auditedBlogEnrichment } from '@/lib/blog/audit-enrichment';

describe('audited blog enrichment', () => {
  it('supplies FAQs and a related category for the audited emerald post', () => {
    const enrichment = auditedBlogEnrichment('untreated-emerald-for-astrology-panna-stone-benefits-price-buying-guide');

    expect(enrichment?.relatedProductCategoryHref).toBe('/shop/emerald');
    expect(enrichment?.faqs).toHaveLength(3);
  });

  it('does not add fallback editorial content to unrelated posts', () => {
    expect(auditedBlogEnrichment('an-unrelated-post')).toBeUndefined();
  });
});
