import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { getSiteUrl } from '@/lib/resend/email-config';
import type { ProductRef } from '@/lib/recommendations/blocks';

function firstImage(images: unknown): string | null {
  if (!Array.isArray(images) || !images.length) return null;
  const first = images[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && 'url' in first) return String((first as { url: string }).url);
  return null;
}

function priceLabel(price: number | null, pricePerCarat: number | null, mode: string | null): string | null {
  if (mode === 'per_carat' && pricePerCarat != null) return `Rs ${Number(pricePerCarat).toLocaleString('en-IN')} per carat`;
  if (price != null) return `Rs ${Number(price).toLocaleString('en-IN')}`;
  return null;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const search = request.nextUrl.searchParams.get('search')?.trim() || '';
  const admin = createAdminClient();
  let query = admin
    .from('products')
    .select('id, name, slug, origin, price, price_per_carat, price_mode, images, is_active')
    .eq('is_active', true)
    .order('name')
    .limit(24);

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const site = getSiteUrl();
  const products: (ProductRef & { id: string })[] = (data ?? []).map((p) => ({
    id: p.id,
    productId: p.id,
    name: p.name,
    imageUrl: firstImage(p.images),
    slug: p.slug,
    priceLabel: priceLabel(p.price, p.price_per_carat as number | null, p.price_mode),
    origin: p.origin,
    buyUrl: p.slug ? `${site}/products/${p.slug}` : null,
  }));

  return NextResponse.json({ products });
}
