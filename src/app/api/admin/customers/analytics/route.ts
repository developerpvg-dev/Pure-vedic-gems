import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { getShortLivedCache } from '@/lib/cache/short-lived';
import { callRpc } from '@/lib/supabase/rpc';

const CACHE_TTL_MS = 60_000;

type CustomerAnalyticsRpc = {
  total_customers: number;
  new_customers: number;
  repeat_customers: number;
  customers_with_orders: number;
  total_customer_revenue: number;
  top_spenders: Array<{ customer_id: string; revenue: number }>;
  consultation_customers: number;
  signup_trend: Array<{ date: string; orders: number; revenue: number }>;
};

export async function GET() {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sinceIso = thirtyDaysAgo.toISOString();

  const cacheKey = `customer-analytics:${sinceIso.slice(0, 10)}`;

  const rpc = await getShortLivedCache(cacheKey, CACHE_TTL_MS, async () => {
    try {
      return await callRpc<CustomerAnalyticsRpc>(admin, 'get_customer_analytics_summary', { p_since: sinceIso });
    } catch {
      const [
        { count: totalCustomers },
        { count: recentCustomers },
        { data: orders },
        { data: consultations },
      ] = await Promise.all([
        admin.from('customer_profiles').select('id', { count: 'exact', head: true }),
        admin
          .from('customer_profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', sinceIso),
        admin
          .from('orders')
          .select('customer_id, total, payment_status')
          .not('customer_id', 'is', null)
          .eq('payment_status', 'captured')
          .limit(5000),
        admin.from('consultations').select('customer_id').not('customer_id', 'is', null).limit(5000),
      ]);

      const customerRevenue = new Map<string, number>();
      const customerOrderCounts = new Map<string, number>();
      for (const order of orders ?? []) {
        if (!order.customer_id) continue;
        customerOrderCounts.set(order.customer_id, (customerOrderCounts.get(order.customer_id) ?? 0) + 1);
        customerRevenue.set(
          order.customer_id,
          (customerRevenue.get(order.customer_id) ?? 0) + Number(order.total ?? 0),
        );
      }

      return {
        total_customers: totalCustomers ?? 0,
        new_customers: recentCustomers ?? 0,
        repeat_customers: Array.from(customerOrderCounts.values()).filter((count) => count > 1).length,
        customers_with_orders: customerOrderCounts.size,
        total_customer_revenue: Array.from(customerRevenue.values()).reduce((sum, value) => sum + value, 0),
        top_spenders: Array.from(customerRevenue.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([customer_id, revenue]) => ({ customer_id, revenue })),
        consultation_customers: new Set((consultations ?? []).map((row) => row.customer_id)).size,
        signup_trend: [],
      } satisfies CustomerAnalyticsRpc;
    }
  });

  const signupTrend = (rpc.signup_trend ?? []).map((row) => {
    const labelDate = new Date(`${row.date}T00:00:00`);
    return {
      date: row.date,
      label: labelDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      orders: row.orders,
      revenue: row.revenue,
      capturedRevenue: row.revenue,
    };
  });

  return NextResponse.json(
    {
      summary: {
        totalCustomers: rpc.total_customers,
        newCustomers30d: rpc.new_customers,
        repeatCustomers: rpc.repeat_customers,
        customersWithOrders: rpc.customers_with_orders,
        totalCustomerRevenue: Number(rpc.total_customer_revenue),
      },
      signupTrend,
      topSpenders: rpc.top_spenders ?? [],
      consultationCustomers: rpc.consultation_customers,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    },
  );
}
