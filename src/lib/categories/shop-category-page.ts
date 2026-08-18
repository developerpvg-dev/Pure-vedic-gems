import { unstable_cache } from 'next/cache';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { getDefaultShopCategoryPage } from '@/lib/categories/shop-category-defaults';
import { KNOWN_CATALOG_SUBCATEGORIES, KNOWN_GEM_SUBCATEGORIES } from '@/lib/categories/shop';
import { canonicalGroupHref, canonicalSubcategoryHref } from '@/lib/categories/canonical-storefront-path';
import { resolveCategoryNavImage } from '@/lib/constants/category-nav-images';
import type { ShopCategoryBrowseCard, ShopCategoryPageContent } from '@/lib/types/shop-category-page';
import type { ShopCategoryPageRow } from '@/lib/types/database';

function normalizeRow(row: ShopCategoryPageRow): ShopCategoryPageContent {
  const heroBenefits = Array.isArray(row.hero_benefits) ? row.hero_benefits as ShopCategoryPageContent['hero_benefits'] : [];
  const faqs = Array.isArray(row.faqs) ? row.faqs as ShopCategoryPageContent['faqs'] : [];
  return {
    ...row,
    hero_benefits: heroBenefits,
    faqs,
    meta_keywords: Array.isArray(row.meta_keywords) ? row.meta_keywords : [],
    geo_service_areas: Array.isArray(row.geo_service_areas) ? row.geo_service_areas : [],
  };
}

function mergeWithDefaults(slug: string, dbRow: ShopCategoryPageContent | null): ShopCategoryPageContent | null {
  const defaults = getDefaultShopCategoryPage(slug);
  if (!defaults && !dbRow) return null;

  if (!dbRow) return defaults;
  if (!defaults) return dbRow;

  const merged: ShopCategoryPageContent = {
    ...defaults,
    ...dbRow,
    hero_benefits: dbRow.hero_benefits?.length ? dbRow.hero_benefits : defaults.hero_benefits,
    faqs: dbRow.faqs?.length ? dbRow.faqs : defaults.faqs,
    meta_keywords: dbRow.meta_keywords?.length ? dbRow.meta_keywords : defaults.meta_keywords,
    intro_text: dbRow.intro_text || defaults.intro_text,
    about_html: dbRow.about_html || defaults.about_html,
    how_to_wear_html: dbRow.how_to_wear_html || defaults.how_to_wear_html,
    who_should_wear_html: dbRow.who_should_wear_html || defaults.who_should_wear_html,
    benefits_html: dbRow.benefits_html || defaults.benefits_html,
    types_html: dbRow.types_html || defaults.types_html,
    quality_price_html: dbRow.quality_price_html || defaults.quality_price_html,
    jewellery_html: dbRow.jewellery_html || defaults.jewellery_html,
    cleaning_care_html: dbRow.cleaning_care_html || defaults.cleaning_care_html,
    buyer_beware_html: dbRow.buyer_beware_html || defaults.buyer_beware_html,
    seo_title: dbRow.seo_title || defaults.seo_title,
    seo_description: dbRow.seo_description || defaults.seo_description,
  };

  // ponytail: parent hubs keep body/hero code-owned; CMS seo_title/description wins when set.
  if (slug === 'navaratna' || slug === 'navratna' || slug === 'rudraksha' || slug === 'upratna') {
    return {
      ...merged,
      name: defaults.name,
      intro_text: defaults.intro_text,
      image_url: defaults.image_url,
      hero_image_url: defaults.hero_image_url,
      hero_benefits: defaults.hero_benefits,
      meta_keywords: defaults.meta_keywords,
      about_html: defaults.about_html,
      how_to_wear_html: defaults.how_to_wear_html,
      who_should_wear_html: defaults.who_should_wear_html,
      benefits_html: defaults.benefits_html,
      types_html: defaults.types_html,
      quality_price_html: defaults.quality_price_html,
      jewellery_html: defaults.jewellery_html,
      cleaning_care_html: defaults.cleaning_care_html,
      buyer_beware_html: defaults.buyer_beware_html,
      faqs: defaults.faqs,
    };
  }

  return merged;
}

async function fetchShopCategoryPageUncached(slug: string): Promise<ShopCategoryPageContent | null> {
  const supabase = createOptionalPublicClient();
  let dbRow: ShopCategoryPageContent | null = null;

  if (supabase) {
    try {
      const { data } = await supabase
        .from('shop_category_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (data) dbRow = normalizeRow(data as ShopCategoryPageRow);
    } catch (error) {
      console.warn(`[shop_category_pages/${slug}] unavailable, using defaults:`, error instanceof Error ? error.message : error);
    }
  }

  return mergeWithDefaults(slug, dbRow);
}

/**
 * Hub page content is shared platform-wide via the Next.js Data Cache, so a
 * category page under heavy traffic reads the DB once per 5 minutes instead
 * of on every request. Admin edits invalidate via the tag below.
 */
export const SHOP_CATEGORY_PAGES_CACHE_TAG = 'shop-category-pages';

export const fetchShopCategoryPage = unstable_cache(
  fetchShopCategoryPageUncached,
  ['shop-category-page'],
  { revalidate: 300, tags: [SHOP_CATEGORY_PAGES_CACHE_TAG] },
);

export async function fetchAllShopCategoryPages(): Promise<ShopCategoryPageContent[]> {
  const supabase = createOptionalPublicClient();
  const dbBySlug = new Map<string, ShopCategoryPageContent>();

  if (supabase) {
    const { data } = await supabase
      .from('shop_category_pages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    for (const row of (data ?? []) as ShopCategoryPageRow[]) {
      dbBySlug.set(row.slug, normalizeRow(row));
    }
  }

  const allSlugs = new Set([
    'navaratna',
    'rudraksha',
    ...Object.keys(KNOWN_GEM_SUBCATEGORIES),
    ...Object.keys(KNOWN_CATALOG_SUBCATEGORIES),
    ...dbBySlug.keys(),
  ]);

  const pages: ShopCategoryPageContent[] = [];
  for (const slug of allSlugs) {
    const merged = mergeWithDefaults(slug, dbBySlug.get(slug) ?? null);
    if (merged) pages.push(merged);
  }

  return pages.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
}

/** Images from /admin/categories (gem_categories + product_categories), keyed by slug. */
async function fetchAdminCategoryImageMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const supabase = createOptionalPublicClient();
  if (!supabase) return map;

  const [gem, catalog] = await Promise.all([
    supabase.from('gem_categories').select('slug, image_url').eq('is_active', true),
    supabase.from('product_categories').select('slug, image_url').eq('is_active', true),
  ]);

  for (const row of catalog.data ?? []) {
    if (row.slug && row.image_url) map.set(row.slug, row.image_url);
  }
  // Gem rows win on slug collision (navaratna/upratna/rudraksha)
  for (const row of gem.data ?? []) {
    if (row.slug && row.image_url) map.set(row.slug, row.image_url);
  }
  return map;
}

export async function fetchShopBrowseCards(): Promise<ShopCategoryBrowseCard[]> {
  const [pages, adminImages] = await Promise.all([
    fetchAllShopCategoryPages(),
    fetchAdminCategoryImageMap(),
  ]);
  return pages.map((page) => toBrowseCard(page, adminImages));
}

export function shopCategoryHref(slug: string) {
  const aliased = slug === 'navratna' || slug === 'navratan' || slug === 'navratana' ? 'navaratna' : slug;
  if (aliased === 'navaratna' || aliased === 'upratna' || aliased === 'rudraksha') {
    return canonicalGroupHref(aliased);
  }
  if (aliased === 'gemstones') return '/gemstones';
  return canonicalSubcategoryHref(aliased) ?? `/shop/${slug}`;
}

export function shopCategoryLabel(page: ShopCategoryPageContent): string {
  return page.sanskrit_name ? `${page.name} (${page.sanskrit_name})` : page.name;
}

export function toBrowseCard(
  page: ShopCategoryPageContent,
  adminImages?: Map<string, string>,
): ShopCategoryBrowseCard {
  const gem = KNOWN_GEM_SUBCATEGORIES[page.slug];
  const catalog = KNOWN_CATALOG_SUBCATEGORIES[page.slug];
  const label = gem?.label ?? catalog?.label ?? shopCategoryLabel(page);
  const adminImage = adminImages?.get(page.slug) ?? null;

  return {
    slug: page.slug,
    name: page.name,
    label,
    href: shopCategoryHref(page.slug),
    // Prefer /admin/categories images over shop-category-pages hub heroes
    image: resolveCategoryNavImage(page.slug, adminImage) ?? page.image_url ?? page.hero_image_url,
    planet: page.planet,
    product_category: page.product_category,
    intro: page.intro_text,
  };
}

export function categoryPageMetadata(page: ShopCategoryPageContent) {
  const label = shopCategoryLabel(page);
  return {
    title: page.seo_title ?? `Buy ${label} Online | PureVedicGems`,
    description: page.seo_description ?? page.intro_text ?? `Shop certified ${label} at PureVedicGems.`,
    keywords: page.meta_keywords ?? [],
    path: shopCategoryHref(page.slug),
    image: page.hero_image_url ?? page.image_url,
  };
}
