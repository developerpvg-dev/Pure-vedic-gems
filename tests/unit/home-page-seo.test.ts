import { describe, expect, it } from 'vitest';
import { HOME_PAGE_DESCRIPTION, HOME_PAGE_TITLE, homePageJsonLd } from '@/lib/seo/home-page';
import { fitDescription, fitTitle, organizationJsonLd, productJsonLd } from '@/lib/utils/seo';
import type { ProductCard } from '@/lib/types/product';
import { expectOwnBrandCopy } from './expect-own-brand-copy';

describe('homepage SEO (head + JSON-LD only)', () => {
  it('nests buy gemstones and natural gemstones in the homepage title and description', () => {
    const title = fitTitle(HOME_PAGE_TITLE);
    const description = fitDescription(HOME_PAGE_DESCRIPTION);
    expect(title.toLowerCase()).toContain('buy gemstones');
    expect(title.toLowerCase()).toContain('buy gemstones online');
    expect(title.toLowerCase()).toContain('natural gemstones');
    expect(title.toLowerCase()).toContain('gemstones for sale');
    expect(description.toLowerCase()).toContain('buy gemstones');
    expect(description.toLowerCase()).toContain('natural gemstones');
    expect(description.toLowerCase()).toContain('loose gemstones');
    expect(description.toLowerCase()).toContain('gemstone prices');
    expect(description.toLowerCase()).toContain('rudraksha');
  });

  it('emits WebPage, JewelryStore, and OfferCatalog URLs for every storefront hub', () => {
    const graph = JSON.stringify(homePageJsonLd());
    expect(graph).toContain('"@type":"WebPage"');
    expect(graph).toContain('"@type":"JewelryStore"');
    expect(graph).toContain('"@type":"OfferCatalog"');
    expect(graph).toContain('/gemstones/navaratna/ruby');
    expect(graph).toContain('/gemstones/upratna/amethyst');
    expect(graph).toContain('/rudraksha/5-mukhi');
    expect(graph).toContain('/shop/jewelry');
    expectOwnBrandCopy(graph);
  });

  it('declares a 15-day merchant return policy on the organization graph', () => {
    const org = organizationJsonLd();
    const policy = org.hasMerchantReturnPolicy as { merchantReturnDays?: number; url?: string; '@id'?: string };
    expect(policy.merchantReturnDays).toBe(15);
    expect(policy.url).toMatch(/\/policies\/returns$/);
    expect(policy['@id']).toMatch(/\/policies\/returns#policy$/);
    expect(org.hasShippingService).toBeTruthy();
  });

  it('emits merchant listing fields and aggregateRating on product JSON-LD', () => {
    const product = {
      id: '1',
      sku: 'RUBY-1',
      slug: 'ruby-1',
      name: 'Natural Ruby',
      category: 'gemstone',
      sub_category: 'ruby',
      price: 5000,
      images: [],
      in_stock: true,
      featured: false,
      is_directors_pick: false,
      created_at: '2026-01-01',
      thumbnail_url: '/gems/ruby.jpg',
    } as ProductCard;

    const schema = productJsonLd(product, '/gemstones/navaratna/ruby/ruby-1', {
      reviews: [
        {
          customer_name: 'Asha',
          rating: 5,
          title: 'Beautiful',
          review_text: 'Certified and as described.',
          created_at: '2026-01-15T00:00:00.000Z',
        },
      ],
    });
    const offers = schema.offers as Record<string, unknown>;
    const rating = schema.aggregateRating as { ratingValue?: number; reviewCount?: number };

    expect(schema.image).toEqual([expect.stringMatching(/\/gems\/ruby\.jpg$/)]);
    expect(offers.hasMerchantReturnPolicy).toEqual({
      '@id': expect.stringMatching(/\/policies\/returns#policy$/),
    });
    expect(offers.shippingDetails).toMatchObject({ '@type': 'OfferShippingDetails' });
    expect(rating.ratingValue).toBe(5);
    expect(rating.reviewCount).toBe(1);
  });
});
