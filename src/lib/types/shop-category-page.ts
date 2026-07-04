export type CategoryFaq = {
  question: string;
  answer: string;
};

export type HeroBenefit = {
  text: string;
};

export type ShopCategorySectionKey =
  | 'about'
  | 'how-to-wear'
  | 'who-should-wear'
  | 'benefits'
  | 'types'
  | 'quality-price'
  | 'jewellery'
  | 'cleaning-care'
  | 'buyer-beware'
  | 'faqs';

export const SHOP_CATEGORY_SECTIONS: Array<{
  key: ShopCategorySectionKey;
  label: string;
  field: keyof ShopCategoryPageContent;
}> = [
  { key: 'about', label: 'About', field: 'about_html' },
  { key: 'how-to-wear', label: 'How To Wear', field: 'how_to_wear_html' },
  { key: 'who-should-wear', label: 'Who Should Wear', field: 'who_should_wear_html' },
  { key: 'benefits', label: 'Benefits', field: 'benefits_html' },
  { key: 'types', label: 'Types', field: 'types_html' },
  { key: 'quality-price', label: 'Quality & Price', field: 'quality_price_html' },
  { key: 'jewellery', label: 'Jewellery', field: 'jewellery_html' },
  { key: 'cleaning-care', label: 'Cleaning & Care', field: 'cleaning_care_html' },
  { key: 'buyer-beware', label: 'Buyer Beware', field: 'buyer_beware_html' },
  { key: 'faqs', label: 'FAQs', field: 'faqs' },
];

export type ShopCategoryPageContent = {
  id?: string;
  slug: string;
  name: string;
  sanskrit_name?: string | null;
  product_category: string;
  planet?: string | null;
  image_url?: string | null;
  hero_image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  meta_keywords?: string[] | null;
  intro_text?: string | null;
  hero_benefits?: HeroBenefit[] | null;
  about_html?: string | null;
  how_to_wear_html?: string | null;
  who_should_wear_html?: string | null;
  benefits_html?: string | null;
  types_html?: string | null;
  quality_price_html?: string | null;
  jewellery_html?: string | null;
  cleaning_care_html?: string | null;
  buyer_beware_html?: string | null;
  faqs?: CategoryFaq[] | null;
  geo_primary_city?: string | null;
  geo_primary_country?: string | null;
  geo_service_areas?: string[] | null;
  sort_order?: number;
  is_active?: boolean;
};

export type ShopCategoryBrowseCard = {
  slug: string;
  name: string;
  label: string;
  href: string;
  image?: string | null;
  planet?: string | null;
  product_category: string;
  intro?: string | null;
};
