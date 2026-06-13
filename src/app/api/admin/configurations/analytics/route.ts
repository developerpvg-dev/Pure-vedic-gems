import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildBreakdown, buildDailyTrend } from '@/lib/admin/analytics-utils';

export async function GET() {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('product_configurations')
    .select('status, metal, setting_type, custom_design_url, custom_design_status, total_price, order_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) return NextResponse.json({ error: 'Failed to load configuration analytics' }, { status: 500 });

  const rows = (data ?? []).map((row) => ({
    ...row,
    total: Number(row.total_price ?? 0),
  }));

  const withCustomDesign = rows.filter((row) => row.custom_design_url);
  const converted = rows.filter((row) => row.order_id);
  const pendingReview = rows.filter((row) =>
    ['pending_custom_design_review', 'pending_review'].includes(row.status ?? '') ||
    ['pending', 'submitted'].includes(row.custom_design_status ?? '')
  );

  return NextResponse.json({
    summary: {
      totalConfigurations: rows.length,
      withCustomDesign: withCustomDesign.length,
      pendingReview: pendingReview.length,
      convertedToOrders: converted.length,
      conversionRate: rows.length ? Math.round((converted.length / rows.length) * 100) : 0,
      totalQuotedValue: rows.reduce((sum, row) => sum + row.total, 0),
      avgQuotedValue: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.total, 0) / rows.length) : 0,
    },
    trend: buildDailyTrend(rows, 30),
    statusBreakdown: buildBreakdown(rows, 'status'),
    metalBreakdown: buildBreakdown(rows, 'metal'),
    settingBreakdown: buildBreakdown(rows, 'setting_type'),
    customDesignBreakdown: [
      { label: 'With custom design', value: withCustomDesign.length, meta: 0 },
      { label: 'Standard config', value: rows.length - withCustomDesign.length, meta: 0 },
      { label: 'Converted to order', value: converted.length, meta: converted.reduce((sum, row) => sum + row.total, 0) },
    ],
  });
}
