import { describe, expect, it } from 'vitest';
import type { Metadata } from 'next';
import { getDefaultShopCategoryPage } from '@/lib/categories/shop-category-defaults';
import { lookupLegacyRedirect } from '@/lib/legacy-redirects';
import { gemProductMeta, mukhiMeta, stripPriceFromTitle } from '@/lib/seo/storefront-meta';
import { fitDescription, fitTitle, productMetadata } from '@/lib/utils/seo';
import type { ProductCard } from '@/lib/types/product';

function absTitle(meta: Metadata) {
  const title = meta.title;
  if (typeof title === 'string') return title;
  if (title && typeof title === 'object' && 'absolute' in title) return String(title.absolute);
  return '';
}

function gemCard(partial: Partial<ProductCard> & Pick<ProductCard, 'name' | 'category'>): ProductCard {
  return {
    id: '1',
    sku: 'sku',
    slug: 'sku',
    name: partial.name,
    category: partial.category ?? 'navaratna',
    sub_category: 'ruby',
    price: 1,
    images: [],
    in_stock: true,
    featured: false,
    is_directors_pick: false,
    created_at: '2026-01-01',
    ...partial,
  } as ProductCard;
}

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

describe('storefront SEO templates', () => {
  it('uses the Manik formula on the Ruby hub', () => {
    const page = getDefaultShopCategoryPage('ruby');
    expect(page?.seo_title).toMatch(/Buy Ruby Online in India \| Natural Manik/);
    expect(page?.seo_title!.length).toBeLessThanOrEqual(60);
    expect(page?.seo_description).toMatch(/Ruby \(Manik\)/);
  });

  it('uses the Upratna child formula on Zircon', () => {
    const page = getDefaultShopCategoryPage('zircon');
    expect(page?.seo_title).toMatch(/Buy Zircon Gemstone Online in India \| Natural Upratna/);
    expect(fitTitle(page!.seo_title!).length).toBeLessThanOrEqual(60);
  });

  it('uses the mukhi formula on 1 Mukhi', () => {
    const page = getDefaultShopCategoryPage('1-mukhi');
    expect(page?.seo_title).toMatch(/Buy 1 Mukhi Rudraksha Online in India/);
    expect(fitTitle(mukhiMeta(1).seo_title).length).toBeLessThanOrEqual(60);
  });

  it('keeps yellow sapphire on the child template, not a price title', () => {
    const page = getDefaultShopCategoryPage('yellow-sapphire');
    expect(page?.seo_title).toMatch(/Natural Pukhraj/);
    expect(page?.seo_title).not.toMatch(/price/i);
  });

  it('gives two Ruby SKUs different titles', () => {
    const burma = absTitle(
      productMetadata(
        gemCard({ name: 'Ruby', category: 'navaratna', origin: 'Burma', carat_weight: 7.9, treatment: 'unheated' }),
        '/gemstones/navaratna/ruby/burma',
      ),
    );
    const african = absTitle(
      productMetadata(
        gemCard({ name: 'Ruby', category: 'navaratna', origin: 'African', carat_weight: 7.58, treatment: 'unheated' }),
        '/gemstones/navaratna/ruby/african',
      ),
    );
    expect(burma).toMatch(/Burma Ruby 7\.9ct/);
    expect(african).toMatch(/African Ruby 7\.58ct/);
    expect(burma).not.toBe(african);
  });

  it('omits Natural when treatment is heated', () => {
    const meta = gemProductMeta({
      name: 'Ruby',
      origin: 'Burma',
      carat: 2,
      vedicName: 'Manik',
      category: 'navaratna',
      treatment: 'heated',
    });
    expect(meta.title).toMatch(/\| Manik/);
    expect(meta.title).not.toMatch(/Natural/);
  });

  it('strips prices from CMS titles', () => {
    expect(stripPriceFromTitle('Buy Ruby @2200 per. ct. | Natural Manik')).toMatch(/Buy Ruby \| Natural Manik/);
  });

  it('leaves jewellery titles on the old path', () => {
    const title = absTitle(
      productMetadata(gemCard({ name: 'Gold Ring', category: 'jewelry', sub_category: 'ring' }), '/shop/ring/gold'),
    );
    expect(title).not.toMatch(/^Buy /);
  });

  it('still 301s /gemstones to Navaratna', () => {
    expect(lookupLegacyRedirect('/gemstones')).toBe('/gemstones/navaratna');
  });
});
