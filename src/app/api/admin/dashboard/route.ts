import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

/**
 * GET /api/admin/dashboard
 * Returns summary stats for the admin dashboard.
 */
export async function GET() {
  const auth = await requireAdminAccess('dashboard.read');
  if ('error' in auth) return auth.error;

  const supabase = createAdminClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekISO = weekStart.toISOString();

  // Parallel queries
  const [
    { data: allOrders },
    { data: todayOrders },
    { data: recentOrders },
    { data: enquiryCount },
    { data: productCount },
    { data: weeklyOrders },
  ] = await Promise.all([
    // All orders
    supabase
      .from('orders')
      .select('id, total, status, payment_status, created_at'),
    // Today's orders
    supabase
      .from('orders')
      .select('id, total, status, payment_status')
      .gte('created_at', todayISO),
    // Recent 10 orders
    supabase
      .from('orders')
      .select('id, order_number, guest_name, guest_email, total, status, payment_status, created_at, items')
      .order('created_at', { ascending: false })
      .limit(10),
    // Enquiry count (new)
    supabase
      .from('enquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),
    // Product count (active)
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    // Last 7 days orders (for chart)
    supabase
      .from('orders')
      .select('id, total, created_at, payment_status')
      .gte('created_at', weekISO)
      .order('created_at', { ascending: true }),
  ]);

  const orders = allOrders ?? [];
  const today = todayOrders ?? [];
  const weekly = weeklyOrders ?? [];

  // Compute stats
  const totalRevenue = orders
    .filter((o) => o.payment_status === 'captured')
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  const todayRevenue = today
    .filter((o) => o.payment_status === 'captured')
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  const pendingOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'refunded'
  ).length;

  // Pipeline counts
  const pipeline: Record<string, number> = {};
  for (const o of orders) {
    pipeline[o.status] = (pipeline[o.status] ?? 0) + 1;
  }

  // Weekly chart data (last 7 days)
  const chartData: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOrders = weekly.filter(
      (o) => o.created_at.startsWith(dateStr)
    );
    chartData.push({
      date: dateStr,
      revenue: dayOrders
        .filter((o) => o.payment_status === 'captured')
        .reduce((s, o) => s + (o.total ?? 0), 0),
      orders: dayOrders.length,
    });
  }

  return NextResponse.json({
    stats: {
      totalOrders: orders.length,
      todayOrders: today.length,
      todayRevenue,
      totalRevenue,
      pendingOrders,
      newEnquiries: enquiryCount ?? 0,
      activeProducts: productCount ?? 0,
    },
    pipeline,
    chartData,
    recentOrders: (recentOrders ?? []).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      customer: o.guest_name || o.guest_email || 'Guest',
      total: o.total,
      status: o.status,
      payment_status: o.payment_status,
      items_count: Array.isArray(o.items) ? o.items.length : 0,
      created_at: o.created_at,
    })),
  });
}
