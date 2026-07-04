/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { getAllDefaultCategorySlugs, getDefaultShopCategoryPage } from '@/lib/categories/shop-category-defaults';
import type { ShopCategoryPageInsert } from '@/lib/types/database';

export async function POST() {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const slugs = getAllDefaultCategorySlugs();
  const rows: ShopCategoryPageInsert[] = slugs
    .map((slug) => getDefaultShopCategoryPage(slug))
    .filter((page): page is NonNullable<typeof page> => Boolean(page))
    .map((page) => ({
      slug: page.slug,
      name: page.name,
      product_category: page.product_category,
      sanskrit_name: page.sanskrit_name ?? null,
      planet: page.planet ?? null,
      image_url: page.image_url ?? null,
      hero_image_url: page.hero_image_url ?? null,
      seo_title: page.seo_title ?? null,
      seo_description: page.seo_description ?? null,
      meta_keywords: page.meta_keywords ?? [],
      intro_text: page.intro_text ?? null,
      hero_benefits: page.hero_benefits ?? [],
      about_html: page.about_html ?? null,
      how_to_wear_html: page.how_to_wear_html ?? null,
      who_should_wear_html: page.who_should_wear_html ?? null,
      benefits_html: page.benefits_html ?? null,
      types_html: page.types_html ?? null,
      quality_price_html: page.quality_price_html ?? null,
      jewellery_html: page.jewellery_html ?? null,
      cleaning_care_html: page.cleaning_care_html ?? null,
      buyer_beware_html: page.buyer_beware_html ?? null,
      faqs: page.faqs ?? [],
      geo_primary_city: page.geo_primary_city ?? 'New Delhi',
      geo_primary_country: page.geo_primary_country ?? 'IN',
      geo_service_areas: page.geo_service_areas ?? [],
      sort_order: 0,
      is_active: true,
    }));

  const { error } = await admin.from('shop_category_pages').upsert(rows, { onConflict: 'slug' });
  if (error) {
    return NextResponse.json({ error: error.message || 'Seed failed' }, { status: 500 });
  }

  revalidatePath('/shop');
  revalidatePath('/api/shop-categories');
  for (const slug of slugs) revalidatePath(`/shop/${slug}`);

  return NextResponse.json({ seeded: rows.length });
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

  revalidatePath('/shop');
  revalidatePath(`/shop/${slug}`);
  return NextResponse.json({ ok: true });
}
