import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

export type DashboardRpcResult = {
  stats: {
    total_orders: number;
    today_orders: number;
    total_revenue: number;
    today_revenue: number;
    pending_orders: number;
    new_enquiries: number;
    active_products: number;
    out_of_stock_products: number;
    total_consultations: number;
    consultation_revenue: number;
  };
  pipeline: Record<string, number>;
  payment_status: Record<string, { count: number; total: number }>;
  consultation_status: Record<string, number>;
  consultation_payments: Record<string, { count: number; total: number }>;
  enquiry_status: Record<string, number>;
  product_availability: Record<string, number>;
  product_categories: Record<string, number>;
  team_roles: Record<string, number>;
  chart_data: Array<{ date: string; revenue: number; orders: number }>;
};

export async function loadDashboardStatsFallback(
  supabase: SupabaseClient<Database>,
  todayISO: string,
  weekISO: string,
): Promise<DashboardRpcResult> {
  const [
    { count: totalOrders },
    { count: todayOrders },
    { data: revenueRows },
    { data: todayRevenueRows },
    { data: statusRows },
    { count: newEnquiries },
    { count: activeProducts },
    { count: outOfStockProducts },
    { count: totalConsultations },
    { data: consultationRevenueRows },
    { data: weeklyOrders },
  ] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('orders').select('total').eq('payment_status', 'captured'),
    supabase.from('orders').select('total').eq('payment_status', 'captured').gte('created_at', todayISO),
    supabase.from('orders').select('status, payment_status, total'),
    supabase.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .lte('stock_quantity', 0),
    supabase.from('consultations').select('id', { count: 'exact', head: true }),
    supabase.from('consultations').select('amount_inr').eq('payment_status', 'captured'),
    supabase
      .from('orders')
      .select('total, created_at, payment_status')
      .gte('created_at', weekISO)
      .order('created_at', { ascending: true }),
  ]);

  const pendingOrders = (statusRows ?? []).filter(
    (row) => !['delivered', 'cancelled', 'refunded'].includes(row.status),
  ).length;

  const pipeline: Record<string, number> = {};
  const paymentStatus: Record<string, { count: number; total: number }> = {};
  for (const row of statusRows ?? []) {
    pipeline[row.status] = (pipeline[row.status] ?? 0) + 1;
    const key = row.payment_status ?? 'unknown';
    paymentStatus[key] = paymentStatus[key] ?? { count: 0, total: 0 };
    paymentStatus[key].count += 1;
    paymentStatus[key].total += row.total ?? 0;
  }

  const chartData: Array<{ date: string; revenue: number; orders: number }> = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOrders = (weeklyOrders ?? []).filter((o) => o.created_at.startsWith(dateStr));
    chartData.push({
      date: dateStr,
      revenue: dayOrders
        .filter((o) => o.payment_status === 'captured')
        .reduce((sum, o) => sum + (o.total ?? 0), 0),
      orders: dayOrders.length,
    });
  }

  return {
    stats: {
      total_orders: totalOrders ?? 0,
      today_orders: todayOrders ?? 0,
      total_revenue: (revenueRows ?? []).reduce((sum, row) => sum + (row.total ?? 0), 0),
      today_revenue: (todayRevenueRows ?? []).reduce((sum, row) => sum + (row.total ?? 0), 0),
      pending_orders: pendingOrders,
      new_enquiries: newEnquiries ?? 0,
      active_products: activeProducts ?? 0,
      out_of_stock_products: outOfStockProducts ?? 0,
      total_consultations: totalConsultations ?? 0,
      consultation_revenue: (consultationRevenueRows ?? []).reduce(
        (sum, row) => sum + Number(row.amount_inr ?? 0),
        0,
      ),
    },
    pipeline,
    payment_status: paymentStatus,
    consultation_status: {},
    consultation_payments: {},
    enquiry_status: {},
    product_availability: {},
    product_categories: {},
    team_roles: {},
    chart_data: chartData,
  };
}
