import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildDailyTrend } from '@/lib/admin/analytics-utils';

export async function GET() {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    { count: totalCustomers },
    { count: recentCustomers },
    { data: orders },
    { data: consultations },
  ] = await Promise.all([
    admin.from('customer_profiles').select('id', { count: 'exact', head: true }),
    admin.from('customer_profiles').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
    admin.from('orders').select('customer_id, total, payment_status, created_at').not('customer_id', 'is', null).limit(5000),
    admin.from('consultations').select('customer_id, amount_inr, payment_status, created_at').not('customer_id', 'is', null).limit(5000),
  ]);

  const customerOrderCounts = new Map<string, number>();
  const customerRevenue = new Map<string, number>();
  for (const order of orders ?? []) {
    if (!order.customer_id || order.payment_status !== 'captured') continue;
    customerOrderCounts.set(order.customer_id, (customerOrderCounts.get(order.customer_id) ?? 0) + 1);
    customerRevenue.set(order.customer_id, (customerRevenue.get(order.customer_id) ?? 0) + Number(order.total ?? 0));
  }

  const repeatCustomers = Array.from(customerOrderCounts.values()).filter((count) => count > 1).length;
  const topSpenders = Array.from(customerRevenue.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, revenue]) => ({ customer_id: id, revenue }));

  const { data: recentProfiles } = await admin
    .from('customer_profiles')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .limit(5000);

  const signupTrend = buildDailyTrend(
    (recentProfiles ?? []).map((p) => ({ created_at: p.created_at, total: 0 })),
    30
  );

  return NextResponse.json({
    summary: {
      totalCustomers: totalCustomers ?? 0,
      newCustomers30d: recentCustomers ?? 0,
      repeatCustomers,
      customersWithOrders: customerOrderCounts.size,
      totalCustomerRevenue: Array.from(customerRevenue.values()).reduce((sum, v) => sum + v, 0),
    },
    signupTrend,
    topSpenders,
    consultationCustomers: (consultations ?? []).filter((c) => c.customer_id).length,
  });
}
