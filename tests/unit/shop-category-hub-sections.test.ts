import { describe, expect, it } from 'vitest';
import { buildCategoryHubSections, resolveCategoryHubProfile } from '@/lib/categories/shop-category-hub-sections';
import type { ShopCategoryPageContent } from '@/lib/types/shop-category-page';

function mockPage(overrides: Partial<ShopCategoryPageContent>): ShopCategoryPageContent {
  return {
    slug: 'shree-yantra',
    name: 'Shree Yantra',
    product_category: 'idol',
    about_html: '<p>About</p>',
    how_to_wear_html: '<p>Placement</p>',
    who_should_wear_html: '<p>Who</p>',
    benefits_html: '<p>Benefits</p>',
    types_html: '<p>Types</p>',
    quality_price_html: '<p>Price</p>',
    jewellery_html: '<p>Jewellery</p>',
    cleaning_care_html: '<p>Care</p>',
    buyer_beware_html: '<p>Beware</p>',
    ...overrides,
  };
}

describe('shop-category-hub-sections', () => {
  it('resolves idol profile', () => {
    expect(resolveCategoryHubProfile('idol')).toBe('idol');
    expect(resolveCategoryHubProfile('jewelry')).toBe('jewelry');
    expect(resolveCategoryHubProfile('navaratna')).toBe('gem');
  });

  it('omits wear and jewellery tabs for idols', () => {
    const sections = buildCategoryHubSections(mockPage({ product_category: 'idol' }), 'Shree Yantra');
    const ids = sections.map((s) => s.id);

    expect(ids).toEqual([
      'about',
      'benefits',
      'how-to-wear',
      'types',
      'quality-price',
      'buyer-beware',
    ]);
    expect(ids).not.toContain('who-should-wear');
    expect(ids).not.toContain('jewellery');
    expect(ids).not.toContain('cleaning-care');
    expect(sections.find((s) => s.id === 'how-to-wear')?.title).toBe('Placement & Puja');
  });

  it('omits jewellery tab for vedic jewellery categories', () => {
    const sections = buildCategoryHubSections(mockPage({ product_category: 'jewelry' }), 'Bracelets');
    const ids = sections.map((s) => s.id);

    expect(ids).not.toContain('jewellery');
    expect(sections.find((s) => s.id === 'how-to-wear')?.title).toBe('Wearing Guide');
    expect(sections.find((s) => s.id === 'who-should-wear')?.title).toBe('Who Is It For');
  });

  it('keeps full gemstone tab set for navaratna', () => {
    const sections = buildCategoryHubSections(mockPage({ product_category: 'navaratna' }), 'Ruby (Manik)');
    expect(sections.map((s) => s.id)).toContain('jewellery');
    expect(sections.map((s) => s.id)).toContain('cleaning-care');
  });

  it('puts blue sapphire stone in H2s while keeping short tab labels', () => {
    const sections = buildCategoryHubSections(
      mockPage({ slug: 'blue-sapphire', name: 'Blue Sapphire Stone', product_category: 'navaratna' }),
      'Blue Sapphire Stone (Neelam)',
    );
    expect(sections.find((s) => s.id === 'about')?.title).toBe('About');
    expect(sections.find((s) => s.id === 'about')?.heading).toMatch(/blue sapphire stone/i);
    expect(sections.find((s) => s.id === 'about')?.heading).toMatch(/cornflower blue sapphire/i);
    expect(sections.find((s) => s.id === 'benefits')?.heading).toMatch(/blue sapphire stone/i);
    expect(sections.find((s) => s.id === 'benefits')?.heading).toMatch(/natural blue sapphire/i);
    expect(sections.every((s) => !s.heading || /blue sapphire stone/i.test(s.heading))).toBe(true);
  });

  it('puts emerald stone in H2s while keeping short tab labels', () => {
    const sections = buildCategoryHubSections(
      mockPage({ slug: 'emerald', name: 'Emerald Stone', product_category: 'navaratna' }),
      'Natural Emerald Stone (Panna)',
    );
    expect(sections.find((s) => s.id === 'about')?.title).toBe('About');
    expect(sections.find((s) => s.id === 'about')?.heading).toMatch(/emerald stone/i);
    expect(sections.find((s) => s.id === 'benefits')?.heading).toMatch(/emerald stone/i);
    expect(sections.every((s) => !s.heading || /emerald stone/i.test(s.heading))).toBe(true);
  });

  it('puts ruby gemstone in H2s while keeping short tab labels', () => {
    const sections = buildCategoryHubSections(
      mockPage({ slug: 'ruby', name: 'Ruby Gemstone', product_category: 'navaratna' }),
      'Natural Ruby Gemstone (Manik)',
    );
    expect(sections.find((s) => s.id === 'about')?.title).toBe('About');
    expect(sections.every((s) => !s.heading || /ruby gemstone/i.test(s.heading))).toBe(true);
  });

  it('puts yellow sapphire in H2s while keeping short tab labels', () => {
    const sections = buildCategoryHubSections(
      mockPage({ slug: 'yellow-sapphire', product_category: 'navaratna' }),
      'Natural Yellow Sapphire (Pukhraj)',
    );
    expect(sections.find((s) => s.id === 'about')?.title).toBe('About');
    expect(sections.every((s) => !s.heading || /yellow sapphire/i.test(s.heading))).toBe(true);
  });

  it('puts white sapphire in H2s while keeping short tab labels', () => {
    const sections = buildCategoryHubSections(
      mockPage({ slug: 'white-sapphire', product_category: 'navaratna' }),
      'Natural White Sapphire (Safed Pukhraj)',
    );
    expect(sections.find((s) => s.id === 'about')?.title).toBe('About');
    expect(sections.every((s) => !s.heading || /white sapphire/i.test(s.heading))).toBe(true);
  });

  it('puts catseye gemstone in H2s while keeping short tab labels', () => {
    const sections = buildCategoryHubSections(
      mockPage({ slug: 'cats-eye', product_category: 'navaratna' }),
      'Natural Catseye Gemstone (Lehsunia)',
    );
    expect(sections.find((s) => s.id === 'about')?.title).toBe('About');
    expect(sections.every((s) => !s.heading || /catseye gemstone/i.test(s.heading))).toBe(true);
  });

  it('puts opal gemstone in H2s while keeping short tab labels', () => {
    const sections = buildCategoryHubSections(
      mockPage({ slug: 'opal', product_category: 'upratna' }),
      'Natural Opal Gemstone (Doodhia Patthar)',
    );
    expect(sections.find((s) => s.id === 'about')?.title).toBe('About');
    expect(sections.every((s) => !s.heading || /opal gemstone/i.test(s.heading))).toBe(true);
  });

  it.each([
    ['pearl', /pearl gemstone/i],
    ['red-coral', /red coral stone/i],
    ['diamond', /diamond gemstone/i],
    ['hessonite', /hessonite stone/i],
    ['pitambari', /pitambari sapphire/i],
    ['exclusive-gems', /exclusive gems/i],
  ] as const)('puts %s phrase in H2s while keeping short tab labels', (slug, phrase) => {
    const sections = buildCategoryHubSections(
      mockPage({ slug, product_category: 'navaratna' }),
      slug,
    );
    expect(sections.find((s) => s.id === 'about')?.title).toBe('About');
    expect(sections.every((s) => !s.heading || phrase.test(s.heading))).toBe(true);
  });

  it.each([
    ['amethyst', /amethyst gemstone/i],
    ['zircon', /zircon gemstone/i],
    ['lapis-lazuli', /lapis lazuli gemstone/i],
  ] as const)('puts %s phrase in H2s while keeping short tab labels', (slug, phrase) => {
    const sections = buildCategoryHubSections(
      mockPage({ slug, product_category: 'upratna' }),
      slug,
    );
    expect(sections.find((s) => s.id === 'about')?.title).toBe('About');
    expect(sections.every((s) => !s.heading || phrase.test(s.heading))).toBe(true);
  });
});
