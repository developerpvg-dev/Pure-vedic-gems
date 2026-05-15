/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { catalogFamilyToStorefrontGroupSlug, storefrontSubcategoryHref } from '@/lib/categories/storefront';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

const GEM_TYPES = ['navaratna', 'upratna', 'rudraksha'] as const;
const CATALOG_FAMILIES = ['idol', 'jewelry', 'mala', 'rudraksha'] as const;
const SOURCES = ['gem', 'catalog'] as const;

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Source = (typeof SOURCES)[number];
type GemType = (typeof GEM_TYPES)[number];
type CatalogFamily = (typeof CATALOG_FAMILIES)[number];

type AdminDb = ReturnType<typeof createAdminClient> & {
  from: (table: string) => any;
};

type PayloadBuildResult =
  | { payload: Record<string, unknown> }
  | { error: NextResponse };

function sanitizeSlug(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function stringOrNull(value: unknown) {
  const next = String(value ?? '').trim();
  return next ? next : null;
}

function numberOrZero(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function booleanOrFalse(value: unknown) {
  return value === true || value === 'true';
}

function isSource(value: unknown): value is Source {
  return (SOURCES as readonly string[]).includes(String(value));
}

function isGemType(value: unknown): value is GemType {
  return (GEM_TYPES as readonly string[]).includes(String(value));
}

function isCatalogFamily(value: unknown): value is CatalogFamily {
  return (CATALOG_FAMILIES as readonly string[]).includes(String(value));
}

function schemaMessage(table: 'gem_categories' | 'product_categories') {
  const migration = table === 'gem_categories'
    ? 'supabase/week12_homepage_section_admin.sql adds is_rare and featured_on_homepage to gem_categories.'
    : 'supabase/week12_homepage_section_admin.sql adds homepage fields to product_categories.';
  return `Database schema is out of date. Please run ${migration}`;
}

function revalidateCategorySurfaces(category?: Record<string, unknown> | null, source?: Source | null) {
  revalidatePath('/');
  revalidatePath('/shop');
  const slug = category?.slug ? String(category.slug) : '';
  if (!slug) return;

  revalidatePath(`/shop/${slug}`);
  if (typeof category?.canonical_path === 'string' && category.canonical_path.startsWith('/shop/')) {
    revalidatePath(category.canonical_path);
  }

  if (source === 'gem' && isGemType(category?.type)) {
    const parentSlug = category.type === 'upratna' ? 'upratna' : category.type === 'rudraksha' ? 'rudraksha' : 'navaratna';
    revalidatePath(storefrontSubcategoryHref(parentSlug, slug));
  }

  if (source === 'catalog' && isCatalogFamily(category?.family)) {
    revalidatePath(defaultCatalogPath(category.family, slug));
  }
}

function defaultCatalogPath(family: CatalogFamily, slug: string) {
  const parentSlug = catalogFamilyToStorefrontGroupSlug(family) ?? 'jewelry';
  return storefrontSubcategoryHref(parentSlug, slug);
}

async function runGemQuery(db: AdminDb) {
  const fullColumns = 'id, name, slug, type, sanskrit_name, planet, emoji, color, image_url, hover_image_url, description, display_locations, is_rare, featured_on_homepage, sort_order, is_active, created_at, updated_at';
  const baseColumns = 'id, name, slug, type, sanskrit_name, planet, emoji, color, image_url, hover_image_url, description, display_locations, sort_order, is_active, created_at, updated_at';

  let result: any = await db
    .from('gem_categories')
    .select(fullColumns)
    .order('type', { ascending: true })
    .order('sort_order', { ascending: true });

  if (result.error?.code === 'PGRST204') {
    result = await db
      .from('gem_categories')
      .select(baseColumns)
      .order('type', { ascending: true })
      .order('sort_order', { ascending: true });
  }

  return result;
}

async function runCatalogQuery(db: AdminDb) {
  const fullColumns = 'id, parent_id, slug, name, family, legacy_names, description, image_url, hover_image_url, homepage_subtitle, homepage_badge, show_on_homepage, homepage_slot, cta_label, accent_color, canonical_path, sort_order, is_active, created_at, updated_at';
  const baseColumns = 'id, parent_id, slug, name, family, legacy_names, description, image_url, seo_title, seo_description, canonical_path, sort_order, is_active, created_at, updated_at';

  let result: any = await db
    .from('product_categories')
    .select(fullColumns)
    .in('family', CATALOG_FAMILIES)
    .order('family', { ascending: true })
    .order('sort_order', { ascending: true });

  if (result.error?.code === 'PGRST204') {
    result = await db
      .from('product_categories')
      .select(baseColumns)
      .in('family', CATALOG_FAMILIES)
      .order('family', { ascending: true })
      .order('sort_order', { ascending: true });
  }

  return result;
}

async function resolveParentId(db: AdminDb, parentSlug: unknown) {
  const safeParentSlug = sanitizeSlug(parentSlug);
  if (!safeParentSlug) return null;

  const { data } = await db
    .from('product_categories')
    .select('id')
    .eq('slug', safeParentSlug)
    .single();

  return data?.id ?? null;
}

function defaultHomepageSlot(family: CatalogFamily) {
  if (family === 'idol') return 'explore_idol';
  if (family === 'jewelry' || family === 'mala') return 'explore_jewelry';
  return 'rudraksha_feature';
}

function validateNameSlug(body: Record<string, unknown>) {
  const name = stringOrNull(body.name);
  const slug = sanitizeSlug(body.slug);

  if (!name || !slug) {
    return { error: NextResponse.json({ error: 'Name and slug are required' }, { status: 400 }) };
  }

  if (!slugRegex.test(slug)) {
    return { error: NextResponse.json({ error: 'Slug must use lowercase letters, numbers, and hyphens' }, { status: 400 }) };
  }

  return { name, slug };
}

async function buildGemPayload(body: Record<string, unknown>, partial = false): Promise<PayloadBuildResult> {
  const base = validateNameSlug(body);
  if ('error' in base && base.error) return base;

  const type = body.type;
  if (!isGemType(type)) {
    return { error: NextResponse.json({ error: 'Gem type must be navaratna, upratna, or rudraksha' }, { status: 400 }) };
  }

  const payload: Record<string, unknown> = {
    name: base.name,
    slug: base.slug,
    type,
    sanskrit_name: stringOrNull(body.sanskrit_name),
    planet: stringOrNull(body.planet),
    emoji: stringOrNull(body.emoji),
    color: stringOrNull(body.color),
    image_url: stringOrNull(body.image_url),
    hover_image_url: stringOrNull(body.hover_image_url),
    description: stringOrNull(body.description),
    display_locations: stringOrNull(body.display_locations),
    is_rare: booleanOrFalse(body.is_rare),
    featured_on_homepage: body.featured_on_homepage === undefined ? true : booleanOrFalse(body.featured_on_homepage),
    sort_order: numberOrZero(body.sort_order),
  };

  if (partial && 'is_active' in body) payload.is_active = booleanOrFalse(body.is_active);
  return { payload };
}

async function buildCatalogPayload(db: AdminDb, body: Record<string, unknown>, partial = false): Promise<PayloadBuildResult> {
  const base = validateNameSlug(body);
  if ('error' in base && base.error) return base;

  const family = body.family;
  if (!isCatalogFamily(family)) {
    return { error: NextResponse.json({ error: 'Catalog family must be idol, jewelry, mala, or rudraksha' }, { status: 400 }) };
  }

  const parentId = await resolveParentId(db, body.parent_slug);
  const homepageSlot = stringOrNull(body.homepage_slot) ?? defaultHomepageSlot(family);
  const canonicalPath = stringOrNull(body.canonical_path) ?? defaultCatalogPath(family, base.slug);

  const payload: Record<string, unknown> = {
    name: base.name,
    slug: base.slug,
    family,
    parent_id: parentId,
    legacy_names: Array.isArray(body.legacy_names) ? body.legacy_names : [],
    description: stringOrNull(body.description),
    image_url: stringOrNull(body.image_url),
    hover_image_url: stringOrNull(body.hover_image_url),
    homepage_subtitle: stringOrNull(body.homepage_subtitle),
    homepage_badge: stringOrNull(body.homepage_badge),
    show_on_homepage: body.show_on_homepage === undefined ? true : booleanOrFalse(body.show_on_homepage),
    homepage_slot: homepageSlot,
    cta_label: stringOrNull(body.cta_label),
    accent_color: stringOrNull(body.accent_color),
    canonical_path: canonicalPath,
    sort_order: numberOrZero(body.sort_order),
  };

  if (partial && 'is_active' in body) payload.is_active = booleanOrFalse(body.is_active);
  return { payload };
}

export async function GET() {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth && auth.error) return auth.error;

  const db = createAdminClient() as AdminDb;
  const [gemResult, catalogResult] = await Promise.all([
    runGemQuery(db),
    runCatalogQuery(db),
  ]);

  if (gemResult.error) {
    console.error('[homepage-categories] Gem fetch error:', gemResult.error);
    return NextResponse.json({ error: 'Failed to fetch gem categories' }, { status: 500 });
  }

  if (catalogResult.error) {
    console.error('[homepage-categories] Catalog fetch error:', catalogResult.error);
    return NextResponse.json({ error: 'Failed to fetch catalog categories' }, { status: 500 });
  }

  return NextResponse.json({
    gem_categories: gemResult.data ?? [],
    catalog_categories: catalogResult.data ?? [],
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth && auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isSource(body.source)) {
    return NextResponse.json({ error: 'source must be gem or catalog' }, { status: 400 });
  }

  const db = createAdminClient() as AdminDb;
  const built = body.source === 'gem'
    ? await buildGemPayload(body)
    : await buildCatalogPayload(db, body);

  if ('error' in built) return built.error;
  const payload = built.payload;

  const table = body.source === 'gem' ? 'gem_categories' : 'product_categories';
  const { data, error } = await (db.from(table) as any)
    .insert(payload)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 409 });
    }
    if (error.code === 'PGRST204') {
      return NextResponse.json({ error: schemaMessage(table), code: error.code }, { status: 422 });
    }
    console.error('[homepage-categories] Create error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }

  revalidateCategorySurfaces(data as Record<string, unknown> | null, body.source);
  return NextResponse.json({ category: data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth && auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const id = stringOrNull(body.id);
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  if (!isSource(body.source)) {
    return NextResponse.json({ error: 'source must be gem or catalog' }, { status: 400 });
  }

  const db = createAdminClient() as AdminDb;
  const built = body.source === 'gem'
    ? await buildGemPayload(body, true)
    : await buildCatalogPayload(db, body, true);

  if ('error' in built) return built.error;
  const payload = built.payload;

  const table = body.source === 'gem' ? 'gem_categories' : 'product_categories';
  const { data, error } = await (db.from(table) as any)
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 409 });
    }
    if (error.code === 'PGRST204') {
      return NextResponse.json({ error: schemaMessage(table), code: error.code }, { status: 422 });
    }
    console.error('[homepage-categories] Update error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }

  revalidateCategorySurfaces(data as Record<string, unknown> | null, body.source);
  return NextResponse.json({ category: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth && auth.error) return auth.error;

  const source = request.nextUrl.searchParams.get('source');
  const id = request.nextUrl.searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  if (!isSource(source)) return NextResponse.json({ error: 'source must be gem or catalog' }, { status: 400 });

  const table = source === 'gem' ? 'gem_categories' : 'product_categories';
  const db = createAdminClient() as AdminDb;
  const { data: existing } = await (db.from(table) as any)
    .select(source === 'gem' ? 'slug, type' : 'slug, family, canonical_path')
    .eq('id', id)
    .single();

  const { error } = await (db.from(table) as any)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[homepage-categories] Delete error:', error);
    return NextResponse.json({ error: 'Failed to deactivate category' }, { status: 500 });
  }

  revalidateCategorySurfaces(existing as Record<string, unknown> | null, source);
  return NextResponse.json({ success: true });
}
