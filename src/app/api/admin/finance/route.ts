import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { PAYMENT_STATUSES, isPaidPaymentStatus } from '@/lib/constants/order-status';
import { buildDailyTrend, resolveDateRange } from '@/lib/admin/analytics-utils';
import { getShortLivedCache } from '@/lib/cache/short-lived';
import { callRpc } from '@/lib/supabase/rpc';

const CACHE_TTL_MS = 60_000;
const MAX_ORDER_ROWS = 2000;

type FinanceRpcResult = {
  filtered: number;
  total: number;
  this_month: number;
  this_week: number;
  today: number;
  consultations: number;
  payment_status_counts: Record<string, { count: number; total: number }>;
  payment_method_counts: Record<string, number>;
  filtered_order_count: number;
};

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('finance.read');
  if ('error' in auth && auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const period = searchParams.get('period') ?? (fromParam || toParam ? 'custom' : 'all');
  const { from, to } = resolveDateRange(fromParam, toParam, period === 'custom' ? 'all' : period);

  const admin = createAdminClient();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const cacheKey = `admin-finance:${period}:${fromParam ?? ''}:${toParam ?? ''}:${startOfToday.slice(0, 10)}`;

  const result = await getShortLivedCache(cacheKey, CACHE_TTL_MS, async () => {
    let revenueRpc: FinanceRpcResult;
    try {
      revenueRpc = await callRpc<FinanceRpcResult>(admin, 'get_admin_finance_revenue', {
        p_from: from ?? null,
        p_to: to ?? null,
        p_start_of_today: startOfToday,
        p_start_of_week: startOfWeek,
        p_start_of_month: startOfMonth,
      });
    } catch {
      const [filteredOrdersResult, totalResult, monthResult, weekResult, todayResult, consultationsResult] =
        await Promise.all([
          admin
            .from('orders')
            .select('total, payment_status, payment_method, created_at, items')
            .gte('created_at', from ?? '1970-01-01')
            .lte('created_at', to ?? new Date().toISOString())
            .limit(MAX_ORDER_ROWS),
          admin.from('orders').select('total, payment_status').eq('payment_status', 'captured'),
          admin
            .from('orders')
            .select('total, payment_status')
            .eq('payment_status', 'captured')
            .gte('created_at', startOfMonth),
          admin
            .from('orders')
            .select('total, payment_status')
            .eq('payment_status', 'captured')
            .gte('created_at', startOfWeek),
          admin
            .from('orders')
            .select('total, payment_status')
            .eq('payment_status', 'captured')
            .gte('created_at', startOfToday),
          admin.from('consultations').select('amount_inr, payment_status').eq('payment_status', 'captured'),
        ]);

      const sumPaid = (rows: { total: number }[] | null) =>
        (rows ?? []).reduce((sum, row) => sum + (Number(row.total) || 0), 0);

      const filteredOrders = filteredOrdersResult.data ?? [];
      revenueRpc = {
        filtered: filteredOrders
          .filter((row) => isPaidPaymentStatus(row.payment_status))
          .reduce((sum, row) => sum + (Number(row.total) || 0), 0),
        total: sumPaid(totalResult.data),
        this_month: sumPaid(monthResult.data),
        this_week: sumPaid(weekResult.data),
        today: sumPaid(todayResult.data),
        consultations: (consultationsResult.data ?? []).reduce(
          (sum, row) => sum + Number(row.amount_inr ?? 0),
          0,
        ),
        payment_status_counts: {},
        payment_method_counts: {},
        filtered_order_count: filteredOrders.length,
      };

      return { revenueRpc, filteredOrders, dateRangeOrders: [] };
    }

    let ordersQuery = admin
      .from('orders')
      .select('total, payment_status, payment_method, created_at, items')
      .order('created_at', { ascending: false })
      .limit(MAX_ORDER_ROWS);
    if (from) ordersQuery = ordersQuery.gte('created_at', from);
    if (to) ordersQuery = ordersQuery.lte('created_at', to);

    const { data: filteredOrders } = await ordersQuery;

    let dateRangeOrders: unknown[] = [];
    if (fromParam && toParam) {
      const { data } = await admin
        .from('orders')
        .select('id, order_number, guest_name, guest_email, total, payment_status, payment_method, status, created_at')
        .gte('created_at', fromParam)
        .lte('created_at', `${toParam}T23:59:59.999Z`)
        .order('created_at', { ascending: false })
        .limit(500);
      dateRangeOrders = data || [];
    }

    return { revenueRpc, filteredOrders: filteredOrders ?? [], dateRangeOrders };
  });

  const { revenueRpc, filteredOrders, dateRangeOrders } = result;

  const filteredRevenue = Number(revenueRpc.filtered);
  const consultationRevenue = Number(revenueRpc.consultations);

  const revenue = {
    filtered: filteredRevenue,
    total: Number(revenueRpc.total),
    thisMonth: Number(revenueRpc.this_month),
    thisWeek: Number(revenueRpc.this_week),
    today: Number(revenueRpc.today),
    consultations: consultationRevenue,
    combined: filteredRevenue + consultationRevenue,
  };

  const paymentStatusCounts: Record<string, { count: number; total: number }> = Object.fromEntries(
    PAYMENT_STATUSES.map((status) => [status, { count: 0, total: 0 }]),
  );
  for (const [status, info] of Object.entries(revenueRpc.payment_status_counts ?? {})) {
    paymentStatusCounts[status] = {
      count: Number(info.count ?? 0),
      total: Number(info.total ?? 0),
    };
  }

  const paymentMethodCounts: Record<string, number> = {};
  for (const [method, count] of Object.entries(revenueRpc.payment_method_counts ?? {})) {
    paymentMethodCounts[method] = Number(count);
  }

  type FinanceOrderItem = {
    product_id?: string;
    name?: string;
    product_name?: string;
    quantity?: number;
    unit_price?: number;
    price?: number;
    line_total?: number;
  };

  const productRevenue: Record<string, { name: string; revenue: number; quantity: number }> = {};
  filteredOrders
    .filter((order) => isPaidPaymentStatus(order.payment_status))
    .forEach((order) => {
      if (!Array.isArray(order.items)) return;
      order.items.forEach((rawItem) => {
        const item = rawItem as FinanceOrderItem;
        const pid = item.product_id || item.name || 'unknown';
        const quantity = Number(item.quantity) || 1;
        const lineRevenue = Number(item.line_total) || (Number(item.unit_price ?? item.price) || 0) * quantity;
        if (!productRevenue[pid]) {
          productRevenue[pid] = { name: item.product_name || item.name || 'Unknown product', revenue: 0, quantity: 0 };
        }
        productRevenue[pid].revenue += lineRevenue;
        productRevenue[pid].quantity += quantity;
      });
    });

  const topProducts = Object.entries(productRevenue)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(([id, data]) => ({ id, ...data }));

  const trend = buildDailyTrend(
    filteredOrders.map((o) => ({
      created_at: o.created_at,
      total: o.total,
      payment_status: isPaidPaymentStatus(o.payment_status) ? 'captured' : o.payment_status,
    })),
    period === '7d' ? 7 : period === '90d' ? 90 : period === '365d' ? 365 : 30,
  );

  return NextResponse.json(
    {
      revenue,
      paymentStatusBreakdown: Object.entries(paymentStatusCounts).map(([label, info]) => ({
        label,
        value: info.count,
        meta: info.total,
      })),
      paymentStatusCounts,
      paymentMethodCounts,
      topProducts,
      trend,
      dateRangeOrders,
      periodLabel: fromParam || toParam ? 'Custom range' : period === 'all' ? 'All time' : `Last ${period.replace('d', ' days')}`,
      sampleSize: revenueRpc.filtered_order_count,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    },
  );
}
