import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { resolveDateRange } from '@/lib/admin/analytics-utils';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

const SELECT =
  'id, order_number, status, created_at, total, guest_name, commission_source, commission_name, commission_amount';

type CommissionOrder = {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total: number;
  guest_name: string | null;
  commission_source: string | null;
  commission_name: string | null;
  commission_amount: number | null;
};

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === '42703' ||
    Boolean(error.message?.includes('does not exist')) ||
    Boolean(error.message?.includes('commission_'))
  );
}

/**
 * GET /api/admin/commissions
 * Admin-only salesperson / astrologer commission rollup for a date range.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('orders.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const period = searchParams.get('period') ?? (fromParam || toParam ? 'custom' : '30d');
  const source = searchParams.get('source')?.trim() || '';
  const name = searchParams.get('name')?.trim().toLowerCase() || '';

  const { from, to } = resolveDateRange(fromParam, toParam, period === 'custom' ? 'all' : period);

  const db = asUntypedSupabase(createAdminClient());
  let query = db
    .from('orders')
    .select(SELECT)
    .or('commission_source.not.is.null,commission_name.not.is.null,commission_amount.not.is.null')
    .order('created_at', { ascending: false })
    .limit(2000);

  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);
  if (source === 'salesperson' || source === 'astrologer') {
    query = query.eq('commission_source', source);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingColumnError(error)) {
      return NextResponse.json({
        needsMigration: true,
        periodLabel: '',
        totals: { orders: 0, commission: 0, orderValue: 0 },
        byPerson: [],
        orders: [],
      });
    }
    console.error('[admin/commissions]', error);
    return NextResponse.json({ error: 'Failed to load commissions' }, { status: 500 });
  }

  let orders = (data ?? []) as CommissionOrder[];
  if (name) {
    orders = orders.filter((o) => (o.commission_name || '').toLowerCase().includes(name));
  }

  const byPersonMap = new Map<
    string,
    { name: string; source: string; orders: number; commission: number; orderValue: number }
  >();

  let totalCommission = 0;
  let totalOrderValue = 0;

  for (const order of orders) {
    const personName = order.commission_name?.trim() || 'Unnamed';
    const personSource = order.commission_source || 'unknown';
    const key = `${personSource}::${personName.toLowerCase()}`;
    const commission = Number(order.commission_amount) || 0;
    const orderValue = Number(order.total) || 0;
    totalCommission += commission;
    totalOrderValue += orderValue;

    const row = byPersonMap.get(key) ?? {
      name: personName,
      source: personSource,
      orders: 0,
      commission: 0,
      orderValue: 0,
    };
    row.orders += 1;
    row.commission += commission;
    row.orderValue += orderValue;
    byPersonMap.set(key, row);
  }

  const byPerson = Array.from(byPersonMap.values()).sort((a, b) => b.commission - a.commission);

  const periodLabel =
    fromParam && toParam
      ? `${fromParam} → ${toParam}`
      : period === 'all'
        ? 'All time'
        : period === '7d'
          ? 'Last 7 days'
          : period === '90d'
            ? 'Last 90 days'
            : period === '365d'
              ? 'Last year'
              : 'Last 30 days';

  return NextResponse.json({
    needsMigration: false,
    periodLabel,
    totals: {
      orders: orders.length,
      commission: totalCommission,
      orderValue: totalOrderValue,
    },
    byPerson,
    orders,
  });
}
