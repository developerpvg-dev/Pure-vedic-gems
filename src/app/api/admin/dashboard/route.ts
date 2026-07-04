import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { getShortLivedCache } from '@/lib/cache/short-lived';
import { callRpc } from '@/lib/supabase/rpc';
import { loadDashboardStatsFallback, type DashboardRpcResult } from '@/lib/admin/dashboard-fallback';

const CACHE_TTL_MS = 60_000;

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
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekISO = weekStart.toISOString();

  const cacheKey = `admin-dashboard:${todayISO.slice(0, 10)}`;

  const payload = await getShortLivedCache(cacheKey, CACHE_TTL_MS, async () => {
    let rpc: DashboardRpcResult;
    try {
      rpc = await callRpc<DashboardRpcResult>(supabase, 'get_admin_dashboard_stats', {
        p_today_start: todayISO,
        p_week_start: weekISO,
      });
    } catch {
      rpc = await loadDashboardStatsFallback(supabase, todayISO, weekISO);
    }

    const [
      { data: recentOrders },
      { data: outOfStockProducts },
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('id, order_number, customer_id, guest_name, guest_email, total, status, payment_status, created_at, items')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('products')
        .select('id, sku, name, category, sub_category, stock_quantity, availability_status')
        .eq('is_active', true)
        .lte('stock_quantity', 0)
        .order('name', { ascending: true })
        .limit(8),
    ]);

    const recentCustomerIds = Array.from(
      new Set((recentOrders ?? []).map((order) => order.customer_id).filter((id): id is string => Boolean(id))),
    );
    const { data: recentProfiles } = recentCustomerIds.length
      ? await supabase
          .from('customer_profiles')
          .select('id, full_name, email')
          .in('id', recentCustomerIds)
      : { data: [] };
    const recentProfileById = new Map((recentProfiles ?? []).map((profile) => [profile.id, profile]));

    return {
      rpc,
      recentOrders: recentOrders ?? [],
      outOfStockProducts: outOfStockProducts ?? [],
      recentProfileById,
    };
  });

  const { rpc, recentOrders, outOfStockProducts, recentProfileById } = payload;
  const stats = rpc.stats;

  return NextResponse.json(
    {
      currentAdmin: {
        role: auth.member.role,
        normalizedRole: auth.member.normalizedRole,
        name: auth.member.name,
      },
      stats: {
        totalOrders: stats.total_orders,
        todayOrders: stats.today_orders,
        todayRevenue: Number(stats.today_revenue),
        totalRevenue: Number(stats.total_revenue),
        pendingOrders: stats.pending_orders,
        newEnquiries: stats.new_enquiries,
        activeProducts: stats.active_products,
        outOfStockProducts: stats.out_of_stock_products,
        totalConsultations: stats.total_consultations,
        consultationRevenue: Number(stats.consultation_revenue),
      },
      pipeline: rpc.pipeline,
      paymentStatus: rpc.payment_status,
      consultationStatus: rpc.consultation_status,
      consultationPayments: rpc.consultation_payments,
      enquiryStatus: rpc.enquiry_status,
      productAvailability: rpc.product_availability,
      productCategories: rpc.product_categories,
      teamRoles: rpc.team_roles,
      chartData: rpc.chart_data,
      outOfStockProducts,
      recentOrders: recentOrders.map((o) => {
        const profile = o.customer_id ? recentProfileById.get(o.customer_id) : undefined;
        return {
          id: o.id,
          order_number: o.order_number,
          customer: o.guest_name || profile?.full_name || o.guest_email || profile?.email || 'Guest',
          total: o.total,
          status: o.status,
          payment_status: o.payment_status,
          items_count: Array.isArray(o.items) ? o.items.length : 0,
          created_at: o.created_at,
        };
      }),
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    },
  );
}
