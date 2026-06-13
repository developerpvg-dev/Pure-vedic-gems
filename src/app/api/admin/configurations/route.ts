import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { sanitizeSearchTerm } from '@/lib/utils/search';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status');
  const rawSearch = searchParams.get('q')?.trim();
  const search = rawSearch ? sanitizeSearchTerm(rawSearch) : undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '50')));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from('product_configurations')
    .select('id, product_id, setting_type, custom_design_url, custom_design_status, metal, ring_size, chain_length, total_price, delivery_eta_label, status, configuration_snapshot, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== 'all') query = query.eq('status', status);
  if (search) {
    query = query.or(`metal.ilike.%${search}%,setting_type.ilike.%${search}%,delivery_eta_label.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to load configurations' }, { status: 500 });

  const rows = data ?? [];
  const productIds = Array.from(new Set(rows.map((row) => row.product_id)));
  let products: Record<string, { id: string; name: string; sku: string | null; tag_number: string | null }> = {};

  if (productIds.length > 0) {
    const { data: productRows } = await admin
      .from('products')
      .select('id, name, sku, tag_number')
      .in('id', productIds);
    products = Object.fromEntries((productRows ?? []).map((row) => [row.id, row]));
  }

  return NextResponse.json({
    configurations: rows.map((row) => ({ ...row, product: products[row.product_id] ?? null })),
    total: count ?? 0,
    page,
    limit,
    total_pages: Math.ceil((count ?? 0) / limit),
  });
}
