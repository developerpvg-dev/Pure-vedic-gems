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

  it('targets blue sapphire stone in title, H1, description, and body', () => {
    const page = getDefaultShopCategoryPage('blue-sapphire');
    expect(page).toBeTruthy();
    const title = page!.seo_title!;
    const description = page!.seo_description!;
    const label = page!.sanskrit_name ? `${page!.name} (${page!.sanskrit_name})` : page!.name;
    const body = [
      page!.intro_text,
      page!.about_html,
      page!.how_to_wear_html,
      page!.who_should_wear_html,
      page!.benefits_html,
      page!.types_html,
      page!.quality_price_html,
      page!.jewellery_html,
      page!.cleaning_care_html,
      page!.buyer_beware_html,
      ...(page!.faqs ?? []).flatMap((faq) => [faq.question, faq.answer]),
    ]
      .join(' ')
      .toLowerCase();
    const phrase = 'blue sapphire stone';
    const occurrences = body.split(phrase).length - 1;

    expect(title).toMatch(/neelam stone/i);
    expect(title).toMatch(/natural blue sapphire/i);
    expect(title.length).toBeGreaterThanOrEqual(30);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(description).toMatch(/blue sapphire stone/i);
    expect(description).toMatch(/natural blue sapphire/i);
    expect(description).toMatch(/cornflower blue sapphire/i);
    expect(description).toMatch(/neelam stone price/i);
    expect(description).toMatch(/royal blue sapphire/i);
    expect(description).toMatch(/light blue sapphire/i);
    expect(description).toMatch(/blue star sapphire/i);
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(label).toMatch(/blue sapphire stone/i);
    expect(label).toMatch(/natural blue sapphire/i);
    expect(label).toMatch(/neelam stone/i);
    expect(page!.about_html).not.toMatch(/<img /i);
    expect(page!.about_html).toMatch(/<h2>Rarity and Legacy of Blue Sapphire<\/h2>/);
    expect(page!.about_html).toMatch(/<h2>What customers say about blue sapphire<\/h2>/);
    expect(page!.quality_price_html).toMatch(/<h2>Factors Affecting Blue Sapphire Price<\/h2>/);
    expect(page!.quality_price_html).toMatch(/<h2>Neelam Stone Price<\/h2>/);
    expect(page!.types_html).toMatch(/<h2>Cornflower Blue Sapphire Colour<\/h2>/);
    expect(page!.types_html).toMatch(/<h2>Royal Blue Sapphire<\/h2>/);
    expect(page!.types_html).toMatch(/<h2>Light Blue Sapphire<\/h2>/);
    expect(page!.types_html).toMatch(/<h2>Blue Star Sapphire<\/h2>/);
    expect(page!.types_html).toMatch(/<h2>Natural Blue Sapphire vs Heated Stone<\/h2>/);
    expect(page!.buyer_beware_html).toMatch(/<h2>Natural Blue Sapphire vs Synthetic<\/h2>/);
    expect(body).not.toMatch(/gempundit|gempundit\.com/i);
    expect(page!.types_html).toMatch(/origin=Kashmir/);
    expect(occurrences).toBeGreaterThanOrEqual(28);
    expect((body.split('cornflower blue sapphire').length - 1)).toBeGreaterThanOrEqual(20);
    expect((body.split('natural blue sapphire').length - 1)).toBeGreaterThanOrEqual(20);
    expect((body.split('neelam stone').length - 1)).toBeGreaterThanOrEqual(12);
    expect((body.split('neelam stone price').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('royal blue sapphire').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('light blue sapphire').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('blue star sapphire').length - 1)).toBeGreaterThanOrEqual(6);
    expect((page!.faqs?.length ?? 0)).toBeGreaterThanOrEqual(13);
    expect(title).toMatch(/blue sapphire/i);
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

  it('301s /shop to the new /gemstones hub', () => {
    expect(lookupLegacyRedirect('/shop')).toBe('/gemstones');
    expect(lookupLegacyRedirect('/gemstones')).toBeNull();
  });
});
