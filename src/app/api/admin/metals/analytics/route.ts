import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildBreakdown } from '@/lib/admin/analytics-utils';

export async function GET() {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('metals')
    .select('name, slug, purity, price_per_gram, is_active, sort_order, created_at')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to load metal analytics' }, { status: 500 });

  const rows = data ?? [];
  const active = rows.filter((row) => row.is_active);
  const prices = active.map((row) => Number(row.price_per_gram ?? 0)).filter((value) => value > 0);

  return NextResponse.json({
    summary: {
      totalMetals: rows.length,
      activeMetals: active.length,
      inactiveMetals: rows.length - active.length,
      avgPricePerGram: prices.length ? Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length) : 0,
      highestPrice: prices.length ? Math.max(...prices) : 0,
      lowestPrice: prices.length ? Math.min(...prices) : 0,
    },
    priceBreakdown: active
      .map((row) => ({
        label: row.name,
        value: Number(row.price_per_gram ?? 0),
        meta: 0,
      }))
      .sort((a, b) => b.value - a.value),
    purityBreakdown: buildBreakdown(rows, 'purity'),
    statusBreakdown: [
      { label: 'Active', value: active.length, meta: active.reduce((sum, row) => sum + Number(row.price_per_gram ?? 0), 0) },
      { label: 'Inactive', value: rows.length - active.length, meta: 0 },
    ],
  });
}
