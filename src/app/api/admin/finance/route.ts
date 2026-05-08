import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { PAYMENT_STATUSES, isPaidPaymentStatus } from '@/lib/constants/order-status';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('finance.read');
  if ('error' in auth && auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const admin = createAdminClient();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Revenue stats
  const [totalResult, monthResult, weekResult, todayResult] = await Promise.all([
    admin.from('orders').select('total, payment_status'),
    admin.from('orders').select('total, payment_status').gte('created_at', startOfMonth),
    admin.from('orders').select('total, payment_status').gte('created_at', startOfWeek),
    admin.from('orders').select('total, payment_status').gte('created_at', startOfToday),
  ]);

  const sumPaidAmounts = (rows: { total: number; payment_status: string }[] | null) =>
    (rows || []).filter((row) => isPaidPaymentStatus(row.payment_status)).reduce((sum, row) => sum + (Number(row.total) || 0), 0);

  const revenue = {
    total: sumPaidAmounts(totalResult.data as { total: number; payment_status: string }[] | null),
    thisMonth: sumPaidAmounts(monthResult.data as { total: number; payment_status: string }[] | null),
    thisWeek: sumPaidAmounts(weekResult.data as { total: number; payment_status: string }[] | null),
    today: sumPaidAmounts(todayResult.data as { total: number; payment_status: string }[] | null),
  };

  // Orders by payment status
  const { data: allOrders } = await admin
    .from('orders')
    .select('payment_status, total, payment_method');

  const paymentStatusCounts: Record<string, { count: number; total: number }> = Object.fromEntries(
    PAYMENT_STATUSES.map((status) => [status, { count: 0, total: 0 }])
  );
  const paymentMethodCounts: Record<string, number> = {};

  (allOrders || []).forEach((o: { payment_status: string; total: number; payment_method: string | null }) => {
    const ps = o.payment_status || 'unknown';
    if (!paymentStatusCounts[ps]) paymentStatusCounts[ps] = { count: 0, total: 0 };
    paymentStatusCounts[ps].count++;
    paymentStatusCounts[ps].total += Number(o.total) || 0;

    const pm = o.payment_method || 'unknown';
    paymentMethodCounts[pm] = (paymentMethodCounts[pm] || 0) + 1;
  });

  // Top selling products (by revenue)
  const { data: capturedOrders } = await admin
    .from('orders')
    .select('items')
    .eq('payment_status', 'captured');

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
  (capturedOrders || []).forEach((order: { items: unknown }) => {
    if (!Array.isArray(order.items)) return;

    order.items.forEach((item: FinanceOrderItem) => {
      const pid = item.product_id || item.name || 'unknown';
      const quantity = Number(item.quantity) || 1;
      const revenue = Number(item.line_total) || (Number(item.unit_price ?? item.price) || 0) * quantity;

      if (!productRevenue[pid]) {
        productRevenue[pid] = { name: item.product_name || item.name || 'Unknown product', revenue: 0, quantity: 0 };
      }
      productRevenue[pid].revenue += revenue;
      productRevenue[pid].quantity += quantity;
    });
  });

  const topProducts = Object.entries(productRevenue)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(([id, data]) => ({ id, ...data }));

  // Orders for date range (for CSV download)
  let dateRangeOrders: unknown[] = [];
  if (from && to) {
    const { data } = await admin
      .from('orders')
      .select('id, order_number, guest_name, guest_email, total, payment_status, payment_method, status, created_at')
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: false })
      .limit(1000);
    dateRangeOrders = data || [];
  }

  return NextResponse.json({
    revenue,
    paymentStatusCounts,
    paymentMethodCounts,
    topProducts,
    dateRangeOrders,
  });
}
