import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

/**
 * GET /api/admin/orders
 * Paginated, filterable order list.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('orders.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status');
  const paymentStatus = searchParams.get('payment_status');
  const search = searchParams.get('search')?.trim();
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (paymentStatus) query = query.eq('payment_status', paymentStatus);
  if (search) {
    query = query.or(`order_number.ilike.%${search}%,guest_name.ilike.%${search}%,guest_email.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[admin/orders] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }

  return NextResponse.json({
    orders: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
