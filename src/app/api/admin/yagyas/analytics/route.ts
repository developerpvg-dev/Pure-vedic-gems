import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildBreakdown, buildDailyTrend } from '@/lib/admin/analytics-utils';

export async function GET() {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('products')
    .select('name, price, planet, is_active, created_at')
    .eq('product_type', 'service')
    .eq('category', 'service')
    .limit(500);

  if (error) return NextResponse.json({ error: 'Failed to load yagya analytics' }, { status: 500 });

  const rows = (data ?? []).map((row) => ({ ...row, total: Number(row.price ?? 0) }));
  const active = rows.filter((row) => row.is_active);
  const prices = active.map((row) => row.total).filter((value) => value > 0);

  return NextResponse.json({
    summary: {
      totalYagyas: rows.length,
      activeYagyas: active.length,
      inactiveYagyas: rows.length - active.length,
      avgPrice: prices.length ? Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length) : 0,
      catalogValue: active.reduce((sum, row) => sum + row.total, 0),
    },
    trend: buildDailyTrend(rows, 30),
    planetBreakdown: buildBreakdown(rows, 'planet'),
    priceBreakdown: active
      .map((row) => ({ label: row.name, value: row.total, meta: 0 }))
      .sort((a, b) => b.value - a.value),
    statusBreakdown: [
      { label: 'Active', value: active.length, meta: 0 },
      { label: 'Inactive', value: rows.length - active.length, meta: 0 },
    ],
  });
}
