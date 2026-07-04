import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildGenericShopCategoryDraft } from '@/lib/categories/shop-category-defaults';

function sanitizeSlug(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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
  const name = String(body.name ?? '').trim();
  const product_category = String(body.product_category ?? '').trim();

  if (!slug || !name || !product_category) {
    return NextResponse.json({ error: 'slug, name, and product_category are required' }, { status: 400 });
  }

  const draft = buildGenericShopCategoryDraft({
    slug,
    name,
    product_category,
    sanskrit_name: body.sanskrit_name ? String(body.sanskrit_name).trim() : null,
    planet: body.planet ? String(body.planet).trim() : null,
  });

  return NextResponse.json({ page: draft });
}
