import type { ShopCategoryPageContent, ShopCategorySectionKey } from '@/lib/types/shop-category-page';

export type CategoryHubProfile = 'gem' | 'rudraksha' | 'idol' | 'jewelry' | 'mala';

export type CategoryHubSectionDef = {
  key: ShopCategorySectionKey;
  field: keyof ShopCategoryPageContent;
  title: (label: string) => string;
};

const SECTION_FIELDS: Record<ShopCategorySectionKey, keyof ShopCategoryPageContent> = {
  about: 'about_html',
  'how-to-wear': 'how_to_wear_html',
  'who-should-wear': 'who_should_wear_html',
  benefits: 'benefits_html',
  types: 'types_html',
  'quality-price': 'quality_price_html',
  jewellery: 'jewellery_html',
  'cleaning-care': 'cleaning_care_html',
  'buyer-beware': 'buyer_beware_html',
  faqs: 'faqs',
};

function gemSections(): CategoryHubSectionDef[] {
  return [
    { key: 'about', field: 'about_html', title: () => 'About' },
    { key: 'how-to-wear', field: 'how_to_wear_html', title: () => 'How To Wear' },
    { key: 'who-should-wear', field: 'who_should_wear_html', title: () => 'Who Should Wear' },
    { key: 'benefits', field: 'benefits_html', title: () => 'Benefits' },
    { key: 'types', field: 'types_html', title: () => 'Types' },
    { key: 'quality-price', field: 'quality_price_html', title: () => 'Quality & Price' },
    { key: 'jewellery', field: 'jewellery_html', title: () => 'Jewellery' },
    { key: 'cleaning-care', field: 'cleaning_care_html', title: () => 'Cleaning & Care' },
    { key: 'buyer-beware', field: 'buyer_beware_html', title: () => 'Buyer Beware' },
  ];
}

const PROFILE_SECTIONS: Record<CategoryHubProfile, CategoryHubSectionDef[]> = {
  gem: gemSections(),
  rudraksha: gemSections(),
  idol: [
    { key: 'about', field: 'about_html', title: () => 'About' },
    { key: 'benefits', field: 'benefits_html', title: () => 'Worship Significance' },
    { key: 'how-to-wear', field: 'how_to_wear_html', title: () => 'Placement & Puja' },
    { key: 'types', field: 'types_html', title: () => 'Materials & Types' },
    { key: 'quality-price', field: 'quality_price_html', title: () => 'Quality & Price' },
    { key: 'buyer-beware', field: 'buyer_beware_html', title: () => 'Buyer Beware' },
  ],
  jewelry: [
    { key: 'about', field: 'about_html', title: () => 'About' },
    { key: 'benefits', field: 'benefits_html', title: () => 'Why Choose Our Jewellery' },
    { key: 'how-to-wear', field: 'how_to_wear_html', title: () => 'Wearing Guide' },
    { key: 'who-should-wear', field: 'who_should_wear_html', title: () => 'Who Is It For' },
    { key: 'types', field: 'types_html', title: () => 'Styles & Designs' },
    { key: 'quality-price', field: 'quality_price_html', title: () => 'Quality & Price' },
    { key: 'cleaning-care', field: 'cleaning_care_html', title: () => 'Care & Maintenance' },
    { key: 'buyer-beware', field: 'buyer_beware_html', title: () => 'Buyer Beware' },
  ],
  mala: [
    { key: 'about', field: 'about_html', title: () => 'About' },
    { key: 'benefits', field: 'benefits_html', title: () => 'Benefits of Japa Mala' },
    { key: 'how-to-wear', field: 'how_to_wear_html', title: () => 'How To Use Your Mala' },
    { key: 'who-should-wear', field: 'who_should_wear_html', title: () => 'Who Is It For' },
    { key: 'types', field: 'types_html', title: () => 'Mala Types' },
    { key: 'quality-price', field: 'quality_price_html', title: () => 'Quality & Price' },
    { key: 'cleaning-care', field: 'cleaning_care_html', title: () => 'Care & Storage' },
    { key: 'buyer-beware', field: 'buyer_beware_html', title: () => 'Buyer Beware' },
  ],
};

export function resolveCategoryHubProfile(productCategory: string): CategoryHubProfile {
  switch (productCategory) {
    case 'idol':
      return 'idol';
    case 'jewelry':
      return 'jewelry';
    case 'rudraksha':
      return 'rudraksha';
    case 'mala':
      return 'mala';
    default:
      return 'gem';
  }
}

export function getCategoryHubSectionDefs(productCategory: string): CategoryHubSectionDef[] {
  return PROFILE_SECTIONS[resolveCategoryHubProfile(productCategory)];
}

const BLUE_SAPPHIRE_HEADINGS: Partial<Record<ShopCategorySectionKey, string>> = {
  about: 'About Cornflower Blue Sapphire Stone',
  'how-to-wear': 'How To Wear Natural Blue Sapphire Stone',
  'who-should-wear': 'Who Should Wear a Natural Blue Sapphire Stone',
  benefits: 'Benefits of Original Natural Blue Sapphire Stone',
  types: 'Types of Cornflower Blue Sapphire Stone',
  'quality-price': 'Pricing Insights Of Natural Blue Sapphire Stone',
  jewellery: 'Types of Natural Blue Sapphire Stone Jewellery',
  'cleaning-care': 'Cleaning and Care for Natural Blue Sapphire Stone',
  'buyer-beware': 'Buyer Beware Guidelines for Original Natural Blue Sapphire Stone',
  faqs: 'Frequently Asked Questions about Natural Blue Sapphire Stone',
};

export function categoryHubSeoHeadings(slug: string) {
  if (slug === 'blue-sapphire') return BLUE_SAPPHIRE_HEADINGS;
  return null;
}

export function buildCategoryHubSections(page: ShopCategoryPageContent, displayLabel: string) {
  const seoHeadings = categoryHubSeoHeadings(page.slug);
  return getCategoryHubSectionDefs(page.product_category).map(({ key, field, title }) => ({
    id: key,
    title: title(displayLabel),
    heading: seoHeadings?.[key],
    html: page[field] as string | null | undefined,
  }));
}

export function getHowToStructuredDataMeta(page: ShopCategoryPageContent, displayLabel: string) {
  const profile = resolveCategoryHubProfile(page.product_category);
  switch (profile) {
    case 'idol':
      return {
        name: `Placement guide for ${displayLabel}`,
        description: `Traditional placement and puja guidance for ${displayLabel}`,
      };
    case 'jewelry':
      return {
        name: `Wearing guide for ${displayLabel}`,
        description: `Vedic wearing guidance for ${displayLabel}`,
      };
    case 'mala':
      return {
        name: `How to use ${displayLabel}`,
        description: `Japa mala usage guide for ${displayLabel}`,
      };
    default:
      return {
        name: `How to wear ${displayLabel}`,
        description: `Vedic wearing guide for ${displayLabel}`,
      };
  }
}

export { SECTION_FIELDS };
