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
});
