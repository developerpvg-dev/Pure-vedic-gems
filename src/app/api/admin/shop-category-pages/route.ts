/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { SHOP_CATEGORY_PAGES_CACHE_TAG } from '@/lib/categories/shop-category-page';
import { getAllDefaultCategorySlugs, getDefaultShopCategoryPage } from '@/lib/categories/shop-category-defaults';
import type { ShopCategoryPageInsert, ShopCategoryPageRow } from '@/lib/types/database';

function stringOrNull(value: unknown) {
  const next = String(value ?? '').trim();
  return next ? next : null;
}

function sanitizeSlug(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

function parseFaqs(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const question = String((item as { question?: string }).question ?? '').trim();
      const answer = String((item as { answer?: string }).answer ?? '').trim();
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter(Boolean);
}

function parseBenefits(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string' && item.trim()) return { text: item.trim() };
      if (item && typeof item === 'object' && 'text' in item) {
        const text = String((item as { text?: string }).text ?? '').trim();
        return text ? { text } : null;
      }
      return null;
    })
    .filter(Boolean);
}

function revalidateCategory(slug: string) {
  revalidatePath('/shop');
  revalidatePath(`/shop/${slug}`);
  revalidatePath('/api/shop-categories');
  revalidateTag(SHOP_CATEGORY_PAGES_CACHE_TAG, 'max');
}

export async function GET() {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('shop_category_pages')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({
        pages: [],
        schemaMissing: true,
        defaults: getAllDefaultCategorySlugs().map((slug) => getDefaultShopCategoryPage(slug)),
      });
    }
    return NextResponse.json({ error: 'Failed to fetch category pages' }, { status: 500 });
  }

  const dbBySlug = new Map(((data ?? []) as ShopCategoryPageRow[]).map((row) => [row.slug, row]));
  const allSlugs = new Set([...getAllDefaultCategorySlugs(), ...dbBySlug.keys()]);

  const pages = [...allSlugs].map((slug) => {
    const defaults = getDefaultShopCategoryPage(slug);
    const db = dbBySlug.get(slug);
    return {
      ...(defaults ?? { slug, name: slug, product_category: 'gemstone' }),
      ...db,
      hasDbRow: Boolean(db),
    };
  });

  return NextResponse.json({ pages, schemaMissing: false });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const slug = sanitizeSlug(body.slug);
  const name = stringOrNull(body.name);
  const product_category = stringOrNull(body.product_category);

  if (!slug || !name || !product_category) {
    return NextResponse.json({ error: 'slug, name, and product_category are required' }, { status: 400 });
  }

  const payload: ShopCategoryPageInsert = {
    slug,
    name,
    product_category,
    sanskrit_name: stringOrNull(body.sanskrit_name),
    planet: stringOrNull(body.planet),
    image_url: stringOrNull(body.image_url),
    hero_image_url: stringOrNull(body.hero_image_url),
    seo_title: stringOrNull(body.seo_title),
    seo_description: stringOrNull(body.seo_description),
    meta_keywords: parseStringArray(body.meta_keywords),
    intro_text: stringOrNull(body.intro_text),
    hero_benefits: parseBenefits(body.hero_benefits),
    about_html: stringOrNull(body.about_html),
    how_to_wear_html: stringOrNull(body.how_to_wear_html),
    who_should_wear_html: stringOrNull(body.who_should_wear_html),
    benefits_html: stringOrNull(body.benefits_html),
    types_html: stringOrNull(body.types_html),
    quality_price_html: stringOrNull(body.quality_price_html),
    jewellery_html: stringOrNull(body.jewellery_html),
    cleaning_care_html: stringOrNull(body.cleaning_care_html),
    buyer_beware_html: stringOrNull(body.buyer_beware_html),
    faqs: parseFaqs(body.faqs),
    geo_primary_city: stringOrNull(body.geo_primary_city) ?? 'New Delhi',
    geo_primary_country: stringOrNull(body.geo_primary_country) ?? 'IN',
    geo_service_areas: parseStringArray(body.geo_service_areas),
    sort_order: Number(body.sort_order) || 0,
    is_active: body.is_active !== false,
  };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('shop_category_pages')
    .upsert(payload, { onConflict: 'slug' })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || 'Failed to save category page' }, { status: 500 });
  }

  revalidateCategory(slug);
  return NextResponse.json({ page: data });
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from('shop_category_pages').delete().eq('slug', slug);

  if (error) {
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }

  revalidateCategory(slug);
  return NextResponse.json({ ok: true });
}
