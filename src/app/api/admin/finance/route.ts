import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { PAYMENT_STATUSES, isPaidPaymentStatus } from '@/lib/constants/order-status';
import { buildDailyTrend, resolveDateRange } from '@/lib/admin/analytics-utils';

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

  let ordersQuery = admin.from('orders').select('total, payment_status, payment_method, created_at, items');
  if (from) ordersQuery = ordersQuery.gte('created_at', from);
  if (to) ordersQuery = ordersQuery.lte('created_at', to);

  const [filteredOrdersResult, totalResult, monthResult, weekResult, todayResult, consultationsResult] = await Promise.all([
    ordersQuery.limit(5000),
    admin.from('orders').select('total, payment_status'),
    admin.from('orders').select('total, payment_status').gte('created_at', startOfMonth),
    admin.from('orders').select('total, payment_status').gte('created_at', startOfWeek),
    admin.from('orders').select('total, payment_status').gte('created_at', startOfToday),
    admin.from('consultations').select('amount_inr, payment_status, created_at').limit(5000),
  ]);

  const filteredOrders = (filteredOrdersResult.data ?? []) as Array<{
    total: number;
    payment_status: string;
    payment_method: string | null;
    created_at: string;
    items: unknown;
  }>;

  const sumPaidAmounts = (rows: { total: number; payment_status: string }[] | null) =>
    (rows || []).filter((row) => isPaidPaymentStatus(row.payment_status)).reduce((sum, row) => sum + (Number(row.total) || 0), 0);

  const filteredRevenue = filteredOrders
    .filter((row) => isPaidPaymentStatus(row.payment_status))
    .reduce((sum, row) => sum + (Number(row.total) || 0), 0);

  const consultationRevenue = (consultationsResult.data ?? [])
    .filter((row) => row.payment_status === 'captured')
    .reduce((sum, row) => sum + Number(row.amount_inr ?? 0), 0);

  const revenue = {
    filtered: filteredRevenue,
    total: sumPaidAmounts(totalResult.data as { total: number; payment_status: string }[] | null),
    thisMonth: sumPaidAmounts(monthResult.data as { total: number; payment_status: string }[] | null),
    thisWeek: sumPaidAmounts(weekResult.data as { total: number; payment_status: string }[] | null),
    today: sumPaidAmounts(todayResult.data as { total: number; payment_status: string }[] | null),
    consultations: consultationRevenue,
    combined: filteredRevenue + consultationRevenue,
  };

  const paymentStatusCounts: Record<string, { count: number; total: number }> = Object.fromEntries(
    PAYMENT_STATUSES.map((status) => [status, { count: 0, total: 0 }])
  );
  const paymentMethodCounts: Record<string, number> = {};

  filteredOrders.forEach((o) => {
    const ps = o.payment_status || 'unknown';
    if (!paymentStatusCounts[ps]) paymentStatusCounts[ps] = { count: 0, total: 0 };
    paymentStatusCounts[ps].count++;
    paymentStatusCounts[ps].total += Number(o.total) || 0;
    const pm = o.payment_method || 'unknown';
    paymentMethodCounts[pm] = (paymentMethodCounts[pm] || 0) + 1;
  });

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
      order.items.forEach((item: FinanceOrderItem) => {
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

  let dateRangeOrders: unknown[] = [];
  if (fromParam && toParam) {
    const { data } = await admin
      .from('orders')
      .select('id, order_number, guest_name, guest_email, total, payment_status, payment_method, status, created_at')
      .gte('created_at', fromParam)
      .lte('created_at', `${toParam}T23:59:59.999Z`)
      .order('created_at', { ascending: false })
      .limit(1000);
    dateRangeOrders = data || [];
  }

  const trend = buildDailyTrend(
    filteredOrders.map((o) => ({
      created_at: o.created_at,
      total: o.total,
      payment_status: isPaidPaymentStatus(o.payment_status) ? 'captured' : o.payment_status,
    })),
    period === '7d' ? 7 : period === '90d' ? 90 : period === '365d' ? 365 : 30
  );

  return NextResponse.json({
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
    sampleSize: filteredOrders.length,
  });
}
