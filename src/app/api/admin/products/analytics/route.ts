import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildBreakdown, buildDailyTrend, resolveDateRange } from '@/lib/admin/analytics-utils';
import { LOW_STOCK_THRESHOLD } from '@/lib/inventory/stock-alerts';

const VALID_AVAILABILITY = ['in_stock', 'out_of_stock', 'sold', 'reserved', 'on_demand', 'archived'] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category')?.trim();
  const availability = searchParams.get('availability_status');
  const status = searchParams.get('status');
  const stock = searchParams.get('stock');
  const { from, to } = resolveDateRange(
    searchParams.get('date_from'),
    searchParams.get('date_to'),
    searchParams.get('period') ?? 'all'
  );

  const admin = createAdminClient();
  let query = admin
    .from('products')
    .select('category, sub_category, availability_status, stock_quantity, price, is_active, created_at')
    .limit(5000);

  if (category) query = query.eq('category', category);
  if (availability && VALID_AVAILABILITY.includes(availability as (typeof VALID_AVAILABILITY)[number])) {
    query = query.eq('availability_status', availability as (typeof VALID_AVAILABILITY)[number]);
  }
  if (status === 'active') query = query.eq('is_active', true);
  if (status === 'inactive') query = query.eq('is_active', false);
  if (stock === 'low') query = query.lt('stock_quantity', LOW_STOCK_THRESHOLD).eq('is_active', true);
  if (stock === 'out') query = query.eq('stock_quantity', 0);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to load product analytics' }, { status: 500 });

  const rows = data ?? [];
  const active = rows.filter((p) => p.is_active);
  const lowStock = active.filter((p) => (p.stock_quantity ?? 0) < LOW_STOCK_THRESHOLD);
  const outOfStock = active.filter((p) => (p.stock_quantity ?? 0) <= 0);
  const totalValue = active.reduce((sum, p) => sum + Number(p.price ?? 0), 0);

  return NextResponse.json({
    summary: {
      totalProducts: rows.length,
      activeProducts: active.length,
      inactiveProducts: rows.length - active.length,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      catalogValue: totalValue,
      avgPrice: active.length ? Math.round(totalValue / active.length) : 0,
    },
    categoryBreakdown: buildBreakdown(rows, 'category'),
    availabilityBreakdown: buildBreakdown(rows, 'availability_status'),
    creationTrend: buildDailyTrend(
      rows.map((p) => ({ created_at: p.created_at, total: Number(p.price ?? 0), payment_status: 'captured' as const })),
      30
    ),
  });
}
