import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { rateLimit } from '@/lib/utils/rate-limit';
import { productFiltersSchema } from '@/lib/validators/product';
import { applyShopAvailabilityFilter, applyShopListingSort, applyShopProductFilters } from '@/lib/shop/listing';
import { applyQuoteOnlyListingFilter } from '@/lib/shop/catalog-scope';
import type { ProductListResponse } from '@/lib/types/product';
import { isConfiguratorGemCatalogScope, isRudrakshaConfiguratorBrowseScope } from '@/lib/shop/configurator';

// Card-level columns to select (avoid fetching full descriptions for listing)
const CARD_SELECT = `
  id, sku, slug, name, category, sub_category, price, price_per_carat, compare_price,
  carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url,
  in_stock, stock_quantity, stock_status, sold_individually, featured, is_directors_pick, treatment, planet, created_at, configurator_enabled,
  product_type, tag_number, availability_status, price_mode, quality_label, certificate_lab, certificate_number
`;

export async function GET(request: NextRequest) {
  try {
    // Generous for real shoppers, but stops bots from cycling unique filter
    // combinations that bypass the CDN cache and hammer the database.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!rateLimit(`products:${ip}`, 180, 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const { searchParams } = request.nextUrl;
    const rawParams = Object.fromEntries(searchParams.entries());

    // Validate query params
    const parsed = productFiltersSchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const filters = parsed.data;
    const supabase = createPublicClient();
    const configuratorEnabled = searchParams.get('configurator_enabled') === 'true';
    const catalogScope = isConfiguratorGemCatalogScope(filters.category, filters.sub_category);
    const rudrakshaConfiguratorBrowse = isRudrakshaConfiguratorBrowseScope(
      filters.category,
      configuratorEnabled
    );
    // `configurator_enabled=true` is a browse-mode flag for the configurator UI.
    // For gem/rudraksha catalog scopes it must NOT filter products.configurator_enabled.
    const listingFilters = {
      ...filters,
      configurator_enabled:
        catalogScope || rudrakshaConfiguratorBrowse ? undefined : filters.configurator_enabled,
    };

    // Build query with dynamic filters. 'estimated' count avoids a full scan
    // per unique filter combination; exact for small result sets anyway.
    let query = supabase
      .from('products')
      .select(CARD_SELECT, { count: 'estimated' })
      .eq('is_active', true);

    query = applyShopAvailabilityFilter(query, {
      ...listingFilters,
      configurator_enabled:
        configuratorEnabled && !rudrakshaConfiguratorBrowse
          ? true
          : listingFilters.configurator_enabled,
    });

    // Apply filters
    if (listingFilters.category) {
      query = query.eq('category', listingFilters.category);
    }
    if (listingFilters.product_type) {
      query = query.eq('product_type', listingFilters.product_type);
    }
    if (listingFilters.sub_category) {
      query = query.eq('sub_category', listingFilters.sub_category);
    }
    query = applyQuoteOnlyListingFilter(
      query,
      listingFilters.category,
      listingFilters.sub_category,
      listingFilters.quality_label,
    );
    query = applyShopProductFilters(query, listingFilters);
    if (listingFilters.featured !== undefined) {
      query = query.eq('featured', listingFilters.featured);
    }
    if (listingFilters.directors_pick !== undefined) {
      query = query.eq('is_directors_pick', listingFilters.directors_pick);
    }

    if (configuratorEnabled && !catalogScope) {
      query = query.eq('configurator_enabled', true);
    }

    query = applyShopListingSort(query, listingFilters);

    // Pagination
    const page = listingFilters.page;
    const perPage = listingFilters.per_page;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data: products, count, error } = await query;

    if (error) {
      console.error('Products query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const response: ProductListResponse = {
      products: products ?? [],
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
