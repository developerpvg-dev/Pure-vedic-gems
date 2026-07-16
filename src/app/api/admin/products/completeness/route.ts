import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import {
  productCompletenessFlags,
  productHasGap,
  type CompletenessGap,
  type ProductCompletenessRow,
} from '@/lib/admin/product-completeness';

const GAPS = ['images', 'description', 'certificate', 'video', 'any', 'complete'] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status')?.trim() ?? '';
  const category = searchParams.get('category')?.trim();
  const subCategory = searchParams.get('sub_category')?.trim();
  const search = searchParams.get('search')?.trim() ?? '';
  const gapParam = (searchParams.get('gap') ?? 'any') as CompletenessGap;
  const gap = (GAPS as readonly string[]).includes(gapParam) ? gapParam : 'any';
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') ?? '100', 10) || 100));
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0);

  const admin = createAdminClient();
  let query = admin
    .from('products')
    .select(
      'id, sku, tag_number, name, category, sub_category, is_active, images, short_desc, description, certificate_url, certificate_file_url, certificate_number, certificate_lab, certificate_status, video_url',
    )
    .order('updated_at', { ascending: false })
    .limit(5000);

  if (status === 'active') query = query.eq('is_active', true);
  else if (status === 'inactive') query = query.eq('is_active', false);
  else if (!status) query = query.eq('is_active', true);
  if (category) query = query.eq('category', category);
  if (subCategory) query = query.eq('sub_category', subCategory);
  if (search) {
    const term = search.replace(/[%_,]/g, '');
    if (term) {
      query = query.or(
        `name.ilike.%${term}%,sku.ilike.%${term}%,tag_number.ilike.%${term}%,slug.ilike.%${term}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to load product completeness' }, { status: 500 });
  }

  const rows = (data ?? []) as ProductCompletenessRow[];
  const enriched = rows.map((row) => {
    const flags = productCompletenessFlags(row);
    return {
      id: row.id,
      sku: row.sku,
      tag_number: row.tag_number,
      name: row.name,
      category: row.category,
      sub_category: row.sub_category,
      is_active: row.is_active,
      ...flags,
    };
  });

  const counts = {
    total: enriched.length,
    missingImages: enriched.filter((p) => !p.hasImages).length,
    missingDescription: enriched.filter((p) => !p.hasDescription).length,
    missingCertificate: enriched.filter((p) => !p.hasCertificate).length,
    missingVideo: enriched.filter((p) => !p.hasVideo).length,
    incomplete: enriched.filter((p) => productHasGap(p, 'any')).length,
    complete: enriched.filter((p) => productHasGap(p, 'complete')).length,
  };

  const filtered = enriched.filter((p) => productHasGap(p, gap));
  const products = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    counts,
    gap,
    total_matching: filtered.length,
    products,
  });
}
