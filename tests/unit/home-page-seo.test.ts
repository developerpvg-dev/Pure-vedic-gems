import { describe, expect, it } from 'vitest';
import { HOME_PAGE_DESCRIPTION, HOME_PAGE_TITLE, homePageJsonLd } from '@/lib/seo/home-page';
import { fitDescription, fitTitle, organizationJsonLd } from '@/lib/utils/seo';
import { expectOwnBrandCopy } from './expect-own-brand-copy';

describe('homepage SEO (head + JSON-LD only)', () => {
  it('nests buy gemstones and natural gemstones in a 30–60 title and 50–160 description', () => {
    const title = fitTitle(HOME_PAGE_TITLE);
    const description = fitDescription(HOME_PAGE_DESCRIPTION);
    expect(title.length).toBeGreaterThanOrEqual(30);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.toLowerCase()).toContain('buy gemstones');
    expect(title.toLowerCase()).toContain('buy gemstones online');
    expect(title.toLowerCase()).toContain('natural gemstones');
    expect(title.toLowerCase()).toContain('gemstones for sale');
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(160);
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
    const policy = organizationJsonLd().merchantReturnPolicy as { merchantReturnDays?: number; url?: string };
    expect(policy.merchantReturnDays).toBe(15);
    expect(policy.url).toMatch(/\/policies\/returns$/);
  });
});
