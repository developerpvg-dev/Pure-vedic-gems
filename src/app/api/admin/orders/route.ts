import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

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

function cleanSearch(value: string) {
  return value.replace(/[%,]/g, ' ').trim();
}

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
  const status = searchParams.get('status');
  const paymentStatus = searchParams.get('payment_status');
  const search = searchParams.get('search')?.trim();
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();
  let matchedProfileIds: string[] = [];

  if (search) {
    const searchTerm = `%${cleanSearch(search)}%`;
    const { data: profileMatches } = await supabase
      .from('customer_profiles')
      .select('id')
      .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
      .limit(50);

    matchedProfileIds = (profileMatches ?? []).map((profile) => profile.id);
  }

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (paymentStatus) query = query.eq('payment_status', paymentStatus);
  if (search) {
    const searchTerm = `%${cleanSearch(search)}%`;
    const clauses = [`order_number.ilike.${searchTerm}`, `guest_name.ilike.${searchTerm}`, `guest_email.ilike.${searchTerm}`];
    if (matchedProfileIds.length) clauses.push(`customer_id.in.(${matchedProfileIds.join(',')})`);
    query = query.or(clauses.join(','));
  }

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
