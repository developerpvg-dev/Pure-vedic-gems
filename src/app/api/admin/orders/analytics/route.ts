import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import {
  applyAdminOrderFilters,
  buildBreakdown,
  buildOrderSummary,
  buildOrderTrendData,
  cleanOrderSearch,
  type OrderAnalyticsRow,
} from '@/lib/admin/order-filters';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('orders.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search')?.trim();
  const period = searchParams.get('period') ?? '30d';

  const supabase = createAdminClient();
  let matchedProfileIds: string[] = [];

  if (search) {
    const searchTerm = `%${cleanOrderSearch(search)}%`;
    const { data: profileMatches } = await supabase
      .from('customer_profiles')
      .select('id')
      .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
      .limit(50);
    matchedProfileIds = (profileMatches ?? []).map((profile) => profile.id);
  }

  let query = supabase
    .from('orders')
    .select('id, total, status, payment_status, payment_method, created_at, customer_id')
    .order('created_at', { ascending: true })
    .limit(5000);

  query = applyAdminOrderFilters(query as never, {
    status: searchParams.get('status'),
    payment_status: searchParams.get('payment_status'),
    search,
    date_from: searchParams.get('date_from'),
    date_to: searchParams.get('date_to'),
    period: searchParams.get('period'),
    min_total: searchParams.get('min_total'),
    max_total: searchParams.get('max_total'),
    payment_method: searchParams.get('payment_method'),
    include_energization: searchParams.get('include_energization'),
    refund_status: searchParams.get('refund_status'),
    return_status: searchParams.get('return_status'),
    invoice_status: searchParams.get('invoice_status'),
    customer_type: searchParams.get('customer_type'),
    matchedProfileIds,
  }) as typeof query;

  const { data, error } = await query;
  if (error) {
    console.error('[admin/orders/analytics] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to load order analytics' }, { status: 500 });
  }

  const rows = (data ?? []) as OrderAnalyticsRow[];
  const summary = buildOrderSummary(rows);
  const trend = buildOrderTrendData(rows, period);

  return NextResponse.json({
    summary,
    trend,
    statusBreakdown: buildBreakdown(rows, 'status'),
    paymentBreakdown: buildBreakdown(rows, 'payment_status'),
    paymentMethodBreakdown: buildBreakdown(rows, 'payment_method'),
    sampleSize: rows.length,
  });
}
