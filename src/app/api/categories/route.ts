import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import {
  isRudrakshaStorefrontSlug,
  rudrakshaStorefrontSortOrder,
} from '@/lib/constants/rudraksha-subcategories';
import {
  catalogFamilyToStorefrontGroupSlug,
  STORE_CATEGORY_GROUPS_FALLBACK,
  storefrontSubcategoryHref,
  type StorefrontCategoryGroup,
  type StorefrontCategoryGroupSlug,
  type StorefrontSubCategory,
} from '@/lib/categories/storefront';
import { resolveCategoryNavImage } from '@/lib/constants/category-nav-images';
import { resolveRudrakshaNavImage } from '@/lib/constants/rudraksha-category-images';
import { loadRudrakshaSampleThumbs } from '@/lib/utils/rudraksha-sample-thumbs';

type GemCategoryRow = {
  id: string;
  name: string;
  slug: string;
  type: 'navaratna' | 'upratna' | 'rudraksha';
  sanskrit_name: string | null;
  planet: string | null;
  emoji: string | null;
  color: string | null;
  image_url: string | null;
  hover_image_url: string | null;
  description: string | null;
  display_locations: string | null;
  sort_order: number;
};

type CatalogCategoryRow = {
  id: string;
  slug: string;
  name: string;
  family: 'idol' | 'jewelry' | 'mala' | 'rudraksha';
  description: string | null;
  homepage_subtitle: string | null;
  canonical_path: string | null;
  parent_id: string | null;
  sort_order: number;
};

const STOREFRONT_GROUP_CONFIG: Array<{
  slug: StorefrontCategoryGroupSlug;
  label: string;
  href: string;
  gemType?: GemCategoryRow['type'];
  catalogFamilies?: CatalogCategoryRow['family'][];
}> = [
  { slug: 'navaratna', label: 'Navaratna Gems', href: '/shop/navaratna', gemType: 'navaratna' },
  { slug: 'upratna', label: 'Upratna Gems', href: '/shop/upratna', gemType: 'upratna' },
  { slug: 'rudraksha', label: 'Rudraksha', href: '/shop/rudraksha', gemType: 'rudraksha' },
  { slug: 'idols', label: 'Spiritual Idols', href: '/shop/idols', catalogFamilies: ['idol'] },
  { slug: 'jewelry', label: 'Vedic Jewellery', href: '/shop/jewelry', catalogFamilies: ['jewelry'] },
  { slug: 'malas', label: 'Malas', href: '/shop/malas', catalogFamilies: ['mala'] },
];

function fallbackGroup(slug: StorefrontCategoryGroupSlug) {
  return STORE_CATEGORY_GROUPS_FALLBACK.find((group) => group.slug === slug)!;
}

function gemLabel(category: GemCategoryRow) {
  return category.sanskrit_name ? `${category.name} (${category.sanskrit_name})` : category.name;
}

function gemToSubcategory(category: GemCategoryRow): StorefrontSubCategory {
  const image = resolveCategoryNavImage(category.slug, category.image_url);
  return {
    slug: category.slug,
    label: gemLabel(category),
    href: `/shop/${category.slug}`,
    swatch: category.color,
    image,
    meta: category.type === 'navaratna' ? category.planet ?? null : null,
  };
}

function catalogToSubcategory(category: CatalogCategoryRow): StorefrontSubCategory {
  const parentSlug = catalogFamilyToStorefrontGroupSlug(category.family) ?? 'jewelry';
  const isParentCategory = category.slug === category.family || category.slug === parentSlug;
  return {
    slug: category.slug,
    label: category.name,
    href: isParentCategory ? `/shop/${parentSlug}` : `/shop/${category.slug}`,
    meta: category.homepage_subtitle ?? category.description,
  };
}

function isCatalogSubcategory(row: CatalogCategoryRow) {
  const parentSlug = catalogFamilyToStorefrontGroupSlug(row.family) ?? row.family;
  return Boolean(row.parent_id) && row.slug !== row.family && row.slug !== parentSlug;
}

function buildStorefrontGroups(gemRows: GemCategoryRow[], catalogRows: CatalogCategoryRow[]): StorefrontCategoryGroup[] {
  return STOREFRONT_GROUP_CONFIG.map((group) => {
    const subcategories = group.gemType
      ? gemRows
          .filter((row) => row.type === group.gemType)
          .filter((row) => group.gemType !== 'rudraksha' || isRudrakshaStorefrontSlug(row.slug))
          .sort((a, b) => {
            if (group.gemType !== 'rudraksha') return a.sort_order - b.sort_order;
            return rudrakshaStorefrontSortOrder(a.slug) - rudrakshaStorefrontSortOrder(b.slug);
          })
          .map(gemToSubcategory)
      : catalogRows
          .filter((row) => group.catalogFamilies?.includes(row.family) && isCatalogSubcategory(row))
          .map(catalogToSubcategory);

    return {
      slug: group.slug,
      label: group.label,
      href: group.href,
      subcategories: subcategories.length ? subcategories : fallbackGroup(group.slug).subcategories,
    };
  });
}

const DB_TIMEOUT_MS = process.env.NODE_ENV === 'development' ? 5_000 : 8_000;
const STOREFRONT_CACHE_MS = process.env.NODE_ENV === 'development' ? 120_000 : 300_000;
const STOREFRONT_FAILURE_CACHE_MS = 60_000;

type StorefrontPayload = {
  categories: GemCategoryRow[];
  groups: StorefrontCategoryGroup[];
};

let storefrontCache: { expiresAt: number; payload: StorefrontPayload } | null = null;
let storefrontFailureUntil = 0;
let storefrontInflight: Promise<StorefrontPayload> | null = null;

function readStorefrontCache(): StorefrontPayload | null {
  if (!storefrontCache || Date.now() > storefrontCache.expiresAt) return null;
  return storefrontCache.payload;
}

function writeStorefrontCache(payload: StorefrontPayload) {
  storefrontCache = { expiresAt: Date.now() + STOREFRONT_CACHE_MS, payload };
  storefrontFailureUntil = 0;
}

function isStorefrontFailureCached() {
  return storefrontFailureUntil > Date.now();
}

function markStorefrontFailure() {
  storefrontFailureUntil = Date.now() + STOREFRONT_FAILURE_CACHE_MS;
}

function storefrontFallbackResponse() {
  return NextResponse.json(
    { categories: [], groups: STORE_CATEGORY_GROUPS_FALLBACK },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  );
}

type DbResult<TRow> = { data: TRow[] | null; error: { message: string } | null };

function raceTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`DB query timed out after ${ms}ms`)), ms)
  );
}

async function queryGemCategories(
  supabase: ReturnType<typeof createPublicClient>,
  type?: string | null
): Promise<DbResult<GemCategoryRow>> {
  let q = supabase
    .from('gem_categories')
    .select('id, name, slug, type, sanskrit_name, planet, emoji, color, image_url, hover_image_url, description, display_locations, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (type === 'navaratna' || type === 'upratna' || type === 'rudraksha') {
    q = q.eq('type', type);
  }
  return q as unknown as Promise<DbResult<GemCategoryRow>>;
}

async function queryCatalogCategories(
  supabase: ReturnType<typeof createPublicClient>
): Promise<DbResult<CatalogCategoryRow>> {
  return supabase
    .from('product_categories')
    .select('id, slug, name, family, description, homepage_subtitle, canonical_path, parent_id, sort_order')
    .in('family', ['idol', 'jewelry', 'mala', 'rudraksha'])
    .eq('is_active', true)
    .order('family', { ascending: true })
    .order('sort_order', { ascending: true }) as unknown as Promise<DbResult<CatalogCategoryRow>>;
}

async function withRudrakshaImageFallbacks(
  gemRows: GemCategoryRow[],
  supabase: ReturnType<typeof createPublicClient>,
): Promise<GemCategoryRow[]> {
  if (!gemRows.some((row) => row.type === 'rudraksha' && !row.image_url)) return gemRows;
  const sampleThumbs = await loadRudrakshaSampleThumbs(supabase);
  return gemRows.map((row) => {
    if (row.type !== 'rudraksha') return row;
    return {
      ...row,
      image_url: resolveRudrakshaNavImage(row.slug, row.image_url, sampleThumbs.get(row.slug)),
    };
  });
}

async function fetchStorefrontPayload(
  supabase: ReturnType<typeof createPublicClient>
): Promise<StorefrontPayload> {
  const [gemResult, catalogResult] = await Promise.race([
    Promise.all([queryGemCategories(supabase), queryCatalogCategories(supabase)]),
    raceTimeout(DB_TIMEOUT_MS),
  ]);

  const gemRowsRaw = gemResult.error || !gemResult.data ? [] : gemResult.data;
  const catalogRows = catalogResult.error || !catalogResult.data ? [] : catalogResult.data;

  if (gemResult.error) console.error('[categories] gem_categories error:', gemResult.error);
  if (catalogResult.error) console.error('[categories] product_categories error:', catalogResult.error);

  const gemRows = await withRudrakshaImageFallbacks(gemRowsRaw, supabase);

  return {
    categories: gemRows,
    groups: buildStorefrontGroups(gemRows, catalogRows),
  };
}

async function loadStorefrontPayload(
  supabase: ReturnType<typeof createPublicClient>
): Promise<StorefrontPayload> {
  if (!storefrontInflight) {
    storefrontInflight = fetchStorefrontPayload(supabase).finally(() => {
      storefrontInflight = null;
    });
  }
  return storefrontInflight;
}

/**
 * GET /api/categories
 * Public endpoint — returns active gem categories.
 * Supports ?type=navaratna|upratna|rudraksha filter.
 * Falls back to static data when DB is unreachable.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type');
  const scope = searchParams.get('scope');

  const supabase = createPublicClient();

  // ── Storefront scope: all six groups ──────────────────────────────────
  if (scope === 'storefront') {
    const cached = readStorefrontCache();
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      });
    }

    if (isStorefrontFailureCached()) {
      return storefrontFallbackResponse();
    }

    try {
      const payload = await loadStorefrontPayload(supabase);
      writeStorefrontCache(payload);
      return NextResponse.json(payload, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      });
    } catch (err) {
      markStorefrontFailure();
      console.error('[categories] Storefront fetch failed, using fallback:', (err as Error).message);
      return storefrontFallbackResponse();
    }
  }

  // ── Legacy gem-only scope ─────────────────────────────────────────────
  try {
    const result = await Promise.race([
      queryGemCategories(supabase, type),
      raceTimeout(DB_TIMEOUT_MS),
    ]);

    if (result.error) {
      console.error('[categories] Fetch error:', result.error);
    }

    const categories = await withRudrakshaImageFallbacks(result.data ?? [], supabase);

    return NextResponse.json(
      { categories },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=150' } }
    );
  } catch (err) {
    console.error('[categories] Gem fetch failed, using fallback:', (err as Error).message);
    const fallbackGems = STORE_CATEGORY_GROUPS_FALLBACK
      .filter((g) => !type || g.slug === type)
      .flatMap((g) => g.subcategories.map((sub) => ({ slug: sub.slug, name: sub.label, type: g.slug })));
    return NextResponse.json(
      { categories: fallbackGems },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
