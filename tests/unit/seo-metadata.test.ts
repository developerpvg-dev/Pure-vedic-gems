import { expectOwnBrandCopy } from './expect-own-brand-copy';
import { describe, expect, it } from 'vitest';
import type { Metadata } from 'next';
import { UPRATNA_STOREFRONT_SLUGS } from '@/lib/categories/canonical-storefront-path';
import { getDefaultShopCategoryPage } from '@/lib/categories/shop-category-defaults';
import { shopCategoryLabel } from '@/lib/categories/shop-category-page';
import { lookupLegacyRedirect } from '@/lib/legacy-redirects';
import { gemProductMeta, isStaleMarketingTitle, mukhiMeta, stripPriceFromTitle } from '@/lib/seo/storefront-meta';
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

function hubBody(page: NonNullable<ReturnType<typeof getDefaultShopCategoryPage>>) {
  return [
    page.intro_text,
    page.about_html,
    page.how_to_wear_html,
    page.who_should_wear_html,
    page.benefits_html,
    page.types_html,
    page.quality_price_html,
    page.jewellery_html,
    page.cleaning_care_html,
    page.buyer_beware_html,
    ...(page.faqs ?? []).flatMap((faq) => [faq.question, faq.answer]),
  ]
    .join(' ')
    .toLowerCase();
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

    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).not.toContain('<p>');
    expect(description).not.toMatch(/\s$/);
  });
});

describe('storefront SEO templates', () => {
  it('uses the Manik formula on the Ruby hub', () => {
    const page = getDefaultShopCategoryPage('ruby');
    expect(page?.seo_title).toBe('Buy Ruby Online in India | Natural Manik | Pure Vedic Gems');
    expect(page?.seo_title!.length).toBeGreaterThanOrEqual(30);
    expect(page?.seo_title!.length).toBeLessThanOrEqual(60);
    expect(page?.seo_description).toMatch(/shop ruby \(manik\) gemstones online in india/i);
  });

  it('uses the Upratna child formula on Zircon', () => {
    const page = getDefaultShopCategoryPage('zircon');
    expect(page?.seo_title).toMatch(/Buy Zircon Online in India \| Natural Jarkan/);
    expect(page?.seo_title!.length).toBeGreaterThanOrEqual(30);
    expect(page?.seo_title!.length).toBeLessThanOrEqual(60);
  });

  it.each([...UPRATNA_STOREFRONT_SLUGS])('keeps %s Upratna title in 30–60 and nests the gemstone phrase', (slug) => {
    const page = getDefaultShopCategoryPage(slug)!;
    const name = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const phrase = `${name} gemstone`.toLowerCase();
    expect(page.seo_title!.length).toBeGreaterThanOrEqual(30);
    expect(page.seo_title!.length).toBeLessThanOrEqual(60);
    expect(page.seo_title!.toLowerCase()).toContain(name.toLowerCase());
    expect(page.seo_title!.toLowerCase()).toContain('online in india');
    expect(page.seo_description!.length).toBeGreaterThanOrEqual(50);
    expect(page.seo_description!.length).toBeLessThanOrEqual(160);
    expect(page.seo_description!.toLowerCase()).toContain('explore');
    expect(page.seo_description!.toLowerCase()).toContain(name.toLowerCase());
    expect(shopCategoryLabel(page).toLowerCase()).toContain(phrase);
    expect(page.about_html).not.toMatch(/<img /i);
    if (slug !== 'opal') {
      expect(page.about_html).toContain(`<h2>What is ${name} Gemstone</h2>`);
      expect(page.quality_price_html).toContain(`<h2>${name} Gemstone Price</h2>`);
      expect(page.buyer_beware_html).toContain(`<h2>Original ${name} Gemstone vs Fake</h2>`);
      expect(hubBody(page).split(phrase).length - 1).toBeGreaterThanOrEqual(12);
    }
    expect((page.faqs?.length ?? 0)).toBeGreaterThanOrEqual(10);
  });

  it('uses the mukhi formula on 1 Mukhi', () => {
    const page = getDefaultShopCategoryPage('1-mukhi');
    expect(page?.seo_title).toBe('Buy 1 Mukhi Rudraksha Online in India | Pure Vedic Gems');
    expect(page?.seo_title!.length).toBeGreaterThanOrEqual(30);
    expect(page?.seo_title!.length).toBeLessThanOrEqual(60);
    expect(fitTitle(mukhiMeta(1).seo_title).length).toBeLessThanOrEqual(60);
  });

  it.each(Array.from({ length: 21 }, (_, i) => i + 1))('keeps %s Mukhi Rudraksha title in 30–60 and nests the phrase', (n) => {
    const page = getDefaultShopCategoryPage(`${n}-mukhi`)!;
    const phrase = `${n} mukhi rudraksha`;
    expect(page.seo_title!.length).toBeGreaterThanOrEqual(30);
    expect(page.seo_title!.length).toBeLessThanOrEqual(60);
    expect(page.seo_title!.toLowerCase()).toContain(phrase);
    expect(page.seo_title!.toLowerCase()).toContain('online in india');
    expect(page.seo_description!.length).toBeGreaterThanOrEqual(50);
    expect(page.seo_description!.length).toBeLessThanOrEqual(160);
    expect(page.seo_description!.toLowerCase()).toContain(phrase);
    expect(shopCategoryLabel(page).toLowerCase()).toBe(phrase);
  });

  it('targets 5 Mukhi Rudraksha in body H2s and FAQs', () => {
    const page = getDefaultShopCategoryPage('5-mukhi')!;
    const body = hubBody(page);
    expect(page.about_html).toContain('<h2>What is 5 Mukhi Rudraksha</h2>');
    expect(page.quality_price_html).toContain('<h2>5 Mukhi Rudraksha Price</h2>');
    expect(page.buyer_beware_html).toContain('<h2>Original 5 Mukhi Rudraksha vs Fake</h2>');
    expect(page.about_html).not.toMatch(/<img /i);
    expectOwnBrandCopy(body);
    expect(body.split('5 mukhi rudraksha').length - 1).toBeGreaterThanOrEqual(12);
    expect((page.faqs?.length ?? 0)).toBeGreaterThanOrEqual(10);
  });

  it.each([
    ['gauri-shankar', 'Gauri Shankar Rudraksha', 'gauri shankar rudraksha'],
    ['ganesh-rudraksha', 'Ganesh Rudraksha', 'ganesh rudraksha'],
    ['nir-mukhi', 'Nir Mukhi Rudraksha', 'nir mukhi rudraksha'],
    ['garbh-gauri', 'Garbh Gauri Rudraksha', 'garbh gauri rudraksha'],
    ['sawar-rudraksha', 'Sawar Rudraksha', 'sawar rudraksha'],
  ] as const)('targets %s formation in title, description, and body', (slug, phrase, low) => {
    const page = getDefaultShopCategoryPage(slug)!;
    const body = hubBody(page);
    expect(page.seo_title!.toLowerCase()).toContain(low);
    expect(page.seo_title!.length).toBeGreaterThanOrEqual(30);
    expect(page.seo_title!.length).toBeLessThanOrEqual(60);
    expect(page.seo_description!.toLowerCase()).toContain(low);
    expect(page.seo_description!.length).toBeGreaterThanOrEqual(50);
    expect(page.seo_description!.length).toBeLessThanOrEqual(160);
    expect(page.about_html).toContain(`<h2>What is ${phrase}</h2>`);
    expect(page.quality_price_html).toContain(`<h2>${phrase} Price</h2>`);
    expect(body.split(low).length - 1).toBeGreaterThanOrEqual(12);
    expect((page.faqs?.length ?? 0)).toBeGreaterThanOrEqual(10);
  });

  it('keeps yellow sapphire title in the 30–60 window without stuffing price', () => {
    const page = getDefaultShopCategoryPage('yellow-sapphire');
    expect(page?.seo_title).toMatch(/yellow sapphire/i);
    expect(page?.seo_title).toMatch(/pukhraj/i);
    expect(page?.seo_title).toMatch(/online in india/i);
    expect(page?.seo_title!.length).toBeGreaterThanOrEqual(30);
    expect(page?.seo_title!.length).toBeLessThanOrEqual(60);
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

    expect(title).toMatch(/neelam/i);
    expect(title).toMatch(/blue sapphire/i);
    expect(title).toMatch(/online in india/i);
    expect(title).not.toMatch(/price/i);
    expect(title.length).toBeGreaterThanOrEqual(30);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(description).toMatch(/shop blue sapphire \(neelam\) gemstones online in india/i);
    expect(description).toMatch(/vedic suitability/i);
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(label).toMatch(/blue sapphire stone/i);
    expect(label).toMatch(/natural blue sapphire/i);
    expect(label).toMatch(/neelam stone/i);
    expect(shopCategoryLabel(page!)).toBe(label);
    expect(page!.about_html).not.toMatch(/<img /i);
    expect(page!.about_html).toMatch(/<h2>Rarity and Legacy of Blue Sapphire<\/h2>/);
    expect(page!.about_html).toMatch(/<h2>What customers say about blue sapphire<\/h2>/);
    expect(page!.about_html).toMatch(/<h2>Blue Sapphire Birthstone<\/h2>/);
    expect(page!.quality_price_html).toMatch(/<h2>Factors Affecting Blue Sapphire Price<\/h2>/);
    expect(page!.quality_price_html).toMatch(/<h2>Blue Sapphire Price<\/h2>/);
    expect(page!.quality_price_html).toMatch(/<h2>Neelam Stone Price<\/h2>/);
    expect(page!.types_html).toMatch(/<h2>Cornflower Blue Sapphire Colour<\/h2>/);
    expect(page!.types_html).toMatch(/<h2>Royal Blue Sapphire<\/h2>/);
    expect(page!.types_html).toMatch(/<h2>Light Blue Sapphire<\/h2>/);
    expect(page!.types_html).toMatch(/<h2>Blue Star Sapphire<\/h2>/);
    expect(page!.types_html).toMatch(/<h2>Natural Blue Sapphire vs Heated Stone<\/h2>/);
    expect(page!.buyer_beware_html).toMatch(/<h2>Natural Blue Sapphire vs Synthetic<\/h2>/);
    expectOwnBrandCopy(body);
    expect(page!.types_html).toMatch(/origin=Kashmir/);
    expect(occurrences).toBeGreaterThanOrEqual(28);
    expect((body.split('cornflower blue sapphire').length - 1)).toBeGreaterThanOrEqual(20);
    expect((body.split('natural blue sapphire').length - 1)).toBeGreaterThanOrEqual(20);
    expect((body.split('neelam stone').length - 1)).toBeGreaterThanOrEqual(12);
    expect((body.split('neelam stone price').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('royal blue sapphire').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('light blue sapphire').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('blue star sapphire').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('blue sapphire birthstone').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('blue sapphire price').length - 1)).toBeGreaterThanOrEqual(6);
    expect((page!.faqs?.length ?? 0)).toBeGreaterThanOrEqual(13);
    expect(title).toMatch(/blue sapphire/i);
  });

  it('targets emerald stone in title, H1, description, and body', () => {
    const page = getDefaultShopCategoryPage('emerald');
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

    expect(title).toMatch(/emerald/i);
    expect(title).toMatch(/panna/i);
    expect(title).toMatch(/online in india/i);
    expect(title.length).toBeGreaterThanOrEqual(30);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(description).toMatch(/shop emerald \(panna\) gemstones online in india/i);
    expect(description).toMatch(/vedic suitability/i);
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(label).toMatch(/emerald stone/i);
    expect(label).toMatch(/natural emerald/i);
    expect(label).toMatch(/panna/i);
    expect(shopCategoryLabel(page!)).toBe(label);
    expect(page!.about_html).not.toMatch(/<img /i);
    expect(page!.about_html).toMatch(/<h2>What is an Emerald Stone<\/h2>/);
    expect(page!.types_html).toMatch(/<h2>Emerald Gemstone Origins<\/h2>/);
    expect(page!.types_html).toMatch(/<h2>Natural Emerald vs Oiled Stone<\/h2>/);
    expect(page!.quality_price_html).toMatch(/<h2>Emerald Stone Price<\/h2>/);
    expect(page!.buyer_beware_html).toMatch(/<h2>Real Emerald vs Synthetic<\/h2>/);
    expectOwnBrandCopy(body);
    expect((body.split('emerald stone').length - 1)).toBeGreaterThanOrEqual(20);
    expect((body.split('emerald gemstone').length - 1)).toBeGreaterThanOrEqual(8);
    expect((body.split('natural emerald').length - 1)).toBeGreaterThanOrEqual(12);
    expect((body.split('real emerald').length - 1)).toBeGreaterThanOrEqual(6);
    expect((page!.faqs?.length ?? 0)).toBeGreaterThanOrEqual(10);
  });

  it('targets ruby gemstone in title, H1, description, and body', () => {
    const page = getDefaultShopCategoryPage('ruby')!;
    const body = hubBody(page);
    expect(page.seo_title).toMatch(/ruby/i);
    expect(page.seo_title).toMatch(/manik/i);
    expect(page.seo_title).toMatch(/online in india/i);
    expect(page.seo_title!.length).toBeGreaterThanOrEqual(30);
    expect(page.seo_title!.length).toBeLessThanOrEqual(60);
    expect(page.seo_description).toMatch(/shop ruby \(manik\) gemstones online in india/i);
    expect(page.seo_description).toMatch(/vedic suitability/i);
    expect(page.seo_description!.length).toBeGreaterThanOrEqual(50);
    expect(page.seo_description!.length).toBeLessThanOrEqual(160);
    expect(shopCategoryLabel(page)).toMatch(/ruby gemstone/i);
    expect(shopCategoryLabel(page)).toMatch(/manik/i);
    expect(page.about_html).not.toMatch(/<img /i);
    expect(page.about_html).toMatch(/<h2>What is a Ruby Gemstone<\/h2>/);
    expect(page.types_html).toMatch(/<h2>Ruby Gemstone Origins<\/h2>/);
    expect(page.quality_price_html).toMatch(/<h2>Ruby Stone Price<\/h2>/);
    expect(page.buyer_beware_html).toMatch(/<h2>Natural Ruby vs Synthetic<\/h2>/);
    expectOwnBrandCopy(body);
    expect((body.split('ruby gemstone').length - 1)).toBeGreaterThanOrEqual(20);
    expect((body.split('ruby stone').length - 1)).toBeGreaterThanOrEqual(12);
    expect((body.split('ruby stone price').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('natural ruby').length - 1)).toBeGreaterThanOrEqual(12);
    expect((page.faqs?.length ?? 0)).toBeGreaterThanOrEqual(10);
  });

  it('targets yellow sapphire in title, H1, description, and body', () => {
    const page = getDefaultShopCategoryPage('yellow-sapphire')!;
    const body = hubBody(page);
    expect(page.seo_title).toMatch(/yellow sapphire/i);
    expect(page.seo_title!.length).toBeGreaterThanOrEqual(30);
    expect(page.seo_title!.length).toBeLessThanOrEqual(60);
    expect(page.seo_description).toMatch(/shop yellow sapphire \(pukhraj\) gemstones online in india/i);
    expect(page.seo_description).toMatch(/vedic suitability/i);
    expect(page.seo_description!.length).toBeGreaterThanOrEqual(50);
    expect(page.seo_description!.length).toBeLessThanOrEqual(160);
    expect(shopCategoryLabel(page)).toMatch(/yellow sapphire/i);
    expect(shopCategoryLabel(page)).toMatch(/pukhraj/i);
    expect(page.about_html).not.toMatch(/<img /i);
    expect(page.about_html).toMatch(/<h2>What is a Yellow Sapphire Stone<\/h2>/);
    expect(page.quality_price_html).toMatch(/<h2>Yellow Sapphire Price<\/h2>/);
    expect(page.buyer_beware_html).toMatch(/<h2>Yellow Sapphires for Sale/);
    expectOwnBrandCopy(body);
    expect((body.split('yellow sapphire').length - 1)).toBeGreaterThanOrEqual(20);
    expect((body.split('yellow sapphire stone').length - 1)).toBeGreaterThanOrEqual(8);
    expect((body.split('yellow sapphire price').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('natural yellow sapphire').length - 1)).toBeGreaterThanOrEqual(8);
    expect((body.split('yellow sapphires for sale').length - 1)).toBeGreaterThanOrEqual(6);
    expect((page.faqs?.length ?? 0)).toBeGreaterThanOrEqual(10);
  });

  it('targets white sapphire in title, H1, description, and body', () => {
    const page = getDefaultShopCategoryPage('white-sapphire')!;
    const body = hubBody(page);
    expect(page.seo_title).toMatch(/white sapphire/i);
    expect(page.seo_title!.length).toBeGreaterThanOrEqual(30);
    expect(page.seo_title!.length).toBeLessThanOrEqual(60);
    expect(page.seo_description).toMatch(/shop white sapphire \(safed pukhraj\) gemstones online in india/i);
    expect(page.seo_description).toMatch(/vedic suitability/i);
    expect(page.seo_description!.length).toBeGreaterThanOrEqual(50);
    expect(page.seo_description!.length).toBeLessThanOrEqual(160);
    expect(shopCategoryLabel(page)).toMatch(/white sapphire/i);
    expect(page.about_html).not.toMatch(/<img /i);
    expect(page.about_html).toMatch(/<h2>What is a White Sapphire Stone<\/h2>/);
    expect(page.types_html).toMatch(/<h2>White Sapphire Stone Origins<\/h2>/);
    expect(page.quality_price_html).toMatch(/<h2>Ceylon White Sapphire Quality<\/h2>/);
    expectOwnBrandCopy(body);
    expect((body.split('white sapphire').length - 1)).toBeGreaterThanOrEqual(12);
    expect((body.split('white sapphire gemstone').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('natural white sapphire').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('white sapphire stone').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('ceylon white sapphire').length - 1)).toBeGreaterThanOrEqual(6);
    expect((page.faqs?.length ?? 0)).toBeGreaterThanOrEqual(10);
  });

  it('targets catseye gemstone in title, H1, description, and body', () => {
    const page = getDefaultShopCategoryPage('cats-eye')!;
    const body = hubBody(page);
    expect(page.seo_title).toMatch(/catseye/i);
    expect(page.seo_title).toMatch(/lehsunia/i);
    expect(page.seo_title).toMatch(/online in india/i);
    expect(page.seo_title!.length).toBeGreaterThanOrEqual(30);
    expect(page.seo_title!.length).toBeLessThanOrEqual(60);
    expect(page.seo_description).toMatch(/shop catseye \(lehsunia\) gemstones online in india/i);
    expect(page.seo_description).toMatch(/vedic suitability/i);
    expect(page.seo_description!.length).toBeGreaterThanOrEqual(50);
    expect(page.seo_description!.length).toBeLessThanOrEqual(160);
    expect(shopCategoryLabel(page)).toMatch(/catseye gemstone/i);
    expect(page.about_html).not.toMatch(/<img /i);
    expect(page.about_html).toMatch(/<h2>What is a Catseye Gemstone<\/h2>/);
    expect(page.quality_price_html).toMatch(/<h2>Cats Eye Gemstone Price<\/h2>/);
    expect(page.buyer_beware_html).toMatch(/<h2>Original Cats Eye Stone vs Fake<\/h2>/);
    expectOwnBrandCopy(body);
    expect((body.split('catseye gemstone').length - 1)).toBeGreaterThanOrEqual(20);
    expect((body.split('catseye gem').length - 1)).toBeGreaterThanOrEqual(8);
    expect((body.split("cat's eye chrysoberyl").length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('original cats eye stone').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('cats eye gemstone price').length - 1)).toBeGreaterThanOrEqual(6);
    expect((page.faqs?.length ?? 0)).toBeGreaterThanOrEqual(10);
  });

  it('targets opal gemstone in title, H1, description, and body', () => {
    const page = getDefaultShopCategoryPage('opal')!;
    const body = hubBody(page);
    expect(page.seo_title).toMatch(/opal/i);
    expect(page.seo_title).toMatch(/online in india/i);
    expect(page.seo_title!.length).toBeGreaterThanOrEqual(30);
    expect(page.seo_title!.length).toBeLessThanOrEqual(60);
    expect(page.seo_description).toMatch(/explore opal gemstones online in india/i);
    expect(page.seo_description!.length).toBeGreaterThanOrEqual(50);
    expect(page.seo_description!.length).toBeLessThanOrEqual(160);
    expect(shopCategoryLabel(page)).toMatch(/opal gemstone/i);
    expect(page.about_html).not.toMatch(/<img /i);
    expect(page.about_html).toMatch(/<h2>What is an Opal Gemstone<\/h2>/);
    expect(page.types_html).toMatch(/<h2>Opal Gemstone and Fire Opal<\/h2>/);
    expect(page.quality_price_html).toMatch(/<h2>Opal Price<\/h2>/);
    expect(page.buyer_beware_html).toMatch(/<h2>Opals for Sale/);
    expectOwnBrandCopy(body);
    expect((body.split('opal gemstone').length - 1)).toBeGreaterThanOrEqual(20);
    expect((body.split('opal stone').length - 1)).toBeGreaterThanOrEqual(8);
    expect((body.split('fire opal').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('opal price').length - 1)).toBeGreaterThanOrEqual(6);
    expect((body.split('opals for sale').length - 1)).toBeGreaterThanOrEqual(6);
    expect((page.faqs?.length ?? 0)).toBeGreaterThanOrEqual(10);
  });

  it.each([
    [
      'pearl',
      /pearl/i,
      ['shop pearl (moti) gemstones online in india', 'vedic suitability'],
      '<h2>What is a Pearl Gemstone</h2>',
      'pearl gemstone',
      20,
    ],
    [
      'red-coral',
      /red coral/i,
      ['shop red coral (moonga) gemstones online in india', 'vedic suitability'],
      '<h2>What is a Red Coral Stone</h2>',
      'red coral stone',
      20,
    ],
    [
      'diamond',
      /diamond/i,
      ['shop diamond (heera) gemstones online in india', 'vedic suitability'],
      '<h2>What is a Diamond Gemstone</h2>',
      'diamond gemstone',
      20,
    ],
    [
      'hessonite',
      /hessonite/i,
      ['shop hessonite (gomed) gemstones online in india', 'vedic suitability'],
      '<h2>What is a Hessonite Stone</h2>',
      'hessonite stone',
      20,
    ],
    [
      'pitambari',
      /pitambari sapphire/i,
      ['shop pitambari', 'vedic suitability'],
      '<h2>What is Pitambari Sapphire</h2>',
      'pitambari sapphire',
      20,
    ],
    [
      'exclusive-gems',
      /exclusive gems/i,
      ['rare navaratna'],
      '<h2>What are Exclusive Gems</h2>',
      'exclusive gems',
      12,
    ],
  ] as const)('targets %s in title, H1, description, and body', (slug, titleRe, descPhrases, h2, primary, minPrimary) => {
    const page = getDefaultShopCategoryPage(slug)!;
    const body = hubBody(page);
    expect(page.seo_title).toMatch(titleRe);
    expect(page.seo_title!.length).toBeGreaterThanOrEqual(30);
    expect(page.seo_title!.length).toBeLessThanOrEqual(60);
    expect(page.seo_description!.length).toBeGreaterThanOrEqual(50);
    expect(page.seo_description!.length).toBeLessThanOrEqual(160);
    for (const phrase of descPhrases) {
      expect(page.seo_description!.toLowerCase()).toContain(phrase);
    }
    expect(shopCategoryLabel(page).toLowerCase()).toMatch(titleRe);
    expect(page.about_html).not.toMatch(/<img /i);
    expect(page.about_html).toContain(h2);
    expectOwnBrandCopy(body);
    expect(body.split(primary).length - 1).toBeGreaterThanOrEqual(minPrimary);
    expect((page.faqs?.length ?? 0)).toBeGreaterThanOrEqual(10);
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

  it('ignores stale marketing CMS titles on products', () => {
    const title = absTitle(
      productMetadata(
        gemCard({
          name: 'African Ruby',
          category: 'navaratna',
          origin: 'African',
          carat_weight: 7.58,
          treatment: 'unheated',
          certification: 'GIA',
        }),
        '/gemstones/navaratna/ruby/african-ruby-7-58ct',
        { title: 'Premium African Ruby 7.58 Carat | Exceptional Quality at' },
      ),
    );
    expect(title).toMatch(/African Ruby 7\.58ct/i);
    expect(title).not.toMatch(/Premium|Exceptional/i);
    expect(isStaleMarketingTitle('Premium African Ruby 7.58 Carat | Exceptional Quality at')).toBe(true);
  });

  it('uses main hub formulas', () => {
    expect(getDefaultShopCategoryPage('navaratna')?.seo_title).toBe(
      'Buy Navaratna Gems Online in India | Vedic Gemstones',
    );
    expect(getDefaultShopCategoryPage('rudraksha')?.seo_title).toBe(
      'Buy Original Rudraksha Online in India | Pure Vedic Gems',
    );
    expect(getDefaultShopCategoryPage('upratna')?.seo_title).toBe(
      'Buy Upratna Gems Online in India | Vedic Gemstones',
    );
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
    expect(lookupLegacyRedirect('/shop/cornflower-blue-sapphire')).toBe('/gemstones/navaratna/blue-sapphire');
    expect(lookupLegacyRedirect('/shop/blue-sapphire-price')).toBe('/gemstones/navaratna/blue-sapphire');
    expect(lookupLegacyRedirect('/shop/blue-sapphire-birthstone')).toBe('/gemstones/navaratna/blue-sapphire');
  });
});
