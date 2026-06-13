import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

export async function GET() {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('energization_options')
    .select('name, price, duration, includes_video, is_active, created_at')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to load energization analytics' }, { status: 500 });

  const rows = data ?? [];
  const active = rows.filter((row) => row.is_active);
  const prices = rows.map((row) => Number(row.price ?? 0)).filter((value) => value >= 0);

  return NextResponse.json({
    summary: {
      totalOptions: rows.length,
      activeOptions: active.length,
      withVideo: rows.filter((row) => row.includes_video).length,
      avgPrice: prices.length ? Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
    },
    priceBreakdown: rows
      .map((row) => ({ label: row.name, value: Number(row.price ?? 0), meta: row.includes_video ? 1 : 0 }))
      .sort((a, b) => b.value - a.value),
    videoBreakdown: [
      { label: 'Includes video', value: rows.filter((row) => row.includes_video).length, meta: 0 },
      { label: 'No video', value: rows.filter((row) => !row.includes_video).length, meta: 0 },
    ],
    statusBreakdown: [
      { label: 'Active', value: active.length, meta: 0 },
      { label: 'Inactive', value: rows.length - active.length, meta: 0 },
    ],
  });
}
