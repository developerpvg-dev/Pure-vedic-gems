import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { applyAdminOrderFilters, cleanOrderSearch } from '@/lib/admin/order-filters';

type OrderRow = {
  customer_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
};

type CustomerProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

const SORT_COLUMNS = ['created_at', 'total', 'order_number', 'status', 'payment_status'] as const;

function customerDisplay(order: OrderRow, profile?: CustomerProfileRow) {
  return {
    name: order.guest_name || profile?.full_name || profile?.email || 'Guest',
    email: order.guest_email || profile?.email || '',
    phone: order.guest_phone || profile?.phone || '',
  };
}

/**
 * GET /api/admin/orders
 * Paginated, filterable order list.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('orders.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search')?.trim();
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const offset = (page - 1) * limit;
  const sortByParam = searchParams.get('sort_by') ?? 'created_at';
  const sortBy = (SORT_COLUMNS as readonly string[]).includes(sortByParam)
    ? (sortByParam as (typeof SORT_COLUMNS)[number])
    : 'created_at';
  const ascending = searchParams.get('sort_order') === 'asc';

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

  let query = supabase.from('orders').select('*', { count: 'exact' });

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

  query = query.order(sortBy, { ascending }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[admin/orders] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }

  const orders = (data ?? []) as unknown as OrderRow[];
  const customerIds = Array.from(new Set(orders.map((order) => order.customer_id).filter((id): id is string => Boolean(id))));
  const { data: profiles } = customerIds.length
    ? await supabase
        .from('customer_profiles')
        .select('id, full_name, email, phone')
        .in('id', customerIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile as CustomerProfileRow]));

  const returnedOrders = (data ?? []) as unknown as Array<OrderRow & Record<string, unknown>>;

  return NextResponse.json({
    orders: returnedOrders.map((order) => ({
      ...order,
      customer_display: customerDisplay(order, order.customer_id ? profileById.get(order.customer_id) : undefined),
    })),
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
