import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { LOW_STOCK_THRESHOLD } from '@/lib/inventory/stock-alerts';

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
    { data: lowStockProducts, count: lowStockCount },
    { data: consultations },
    { data: enquiries },
    { data: catalogProducts },
    { data: teamMembers },
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
      .select('id, order_number, customer_id, guest_name, guest_email, total, status, payment_status, created_at, items')
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
    // Low-stock products for inventory attention
    supabase
      .from('products')
      .select('id, sku, name, category, sub_category, stock_quantity, availability_status', { count: 'exact' })
      .eq('is_active', true)
      .lt('stock_quantity', LOW_STOCK_THRESHOLD)
      .order('stock_quantity', { ascending: true })
      .limit(8),
    // Consultation funnel and paid-plan revenue
    supabase
      .from('consultations')
      .select('id, status, payment_status, amount_inr, created_at'),
    // Lead/enquiry workflow health
    supabase
      .from('enquiries')
      .select('id, status, created_at'),
    // Catalog distribution for inventory/content roles
    supabase
      .from('products')
      .select('id, category, product_type, availability_status, stock_quantity')
      .eq('is_active', true),
    // Team role mix for owners/admins
    supabase
      .from('team_members')
      .select('role, is_active'),
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

  const paymentStatus: Record<string, { count: number; total: number }> = {};
  for (const order of orders) {
    const key = order.payment_status ?? 'unknown';
    paymentStatus[key] = paymentStatus[key] ?? { count: 0, total: 0 };
    paymentStatus[key].count += 1;
    paymentStatus[key].total += order.total ?? 0;
  }

  const consultationStatus: Record<string, number> = {};
  const consultationPayments: Record<string, { count: number; total: number }> = {};
  for (const consultation of consultations ?? []) {
    const status = consultation.status ?? 'unknown';
    const paymentStatusKey = consultation.payment_status ?? 'unknown';
    consultationStatus[status] = (consultationStatus[status] ?? 0) + 1;
    consultationPayments[paymentStatusKey] = consultationPayments[paymentStatusKey] ?? { count: 0, total: 0 };
    consultationPayments[paymentStatusKey].count += 1;
    consultationPayments[paymentStatusKey].total += Number(consultation.amount_inr ?? 0);
  }

  const enquiryStatus: Record<string, number> = {};
  for (const enquiry of enquiries ?? []) {
    const status = enquiry.status ?? 'unknown';
    enquiryStatus[status] = (enquiryStatus[status] ?? 0) + 1;
  }

  const productAvailability: Record<string, number> = {};
  const productCategories: Record<string, number> = {};
  for (const product of catalogProducts ?? []) {
    const availability = product.availability_status ?? 'unknown';
    const category = product.category ?? product.product_type ?? 'uncategorized';
    productAvailability[availability] = (productAvailability[availability] ?? 0) + 1;
    productCategories[category] = (productCategories[category] ?? 0) + 1;
  }

  const teamRoles: Record<string, number> = {};
  for (const member of teamMembers ?? []) {
    if (!member.is_active) continue;
    teamRoles[member.role] = (teamRoles[member.role] ?? 0) + 1;
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

  const recentCustomerIds = Array.from(new Set((recentOrders ?? []).map((order) => order.customer_id).filter((id): id is string => Boolean(id))));
  const { data: recentProfiles } = recentCustomerIds.length
    ? await supabase
        .from('customer_profiles')
        .select('id, full_name, email')
        .in('id', recentCustomerIds)
    : { data: [] };
  const recentProfileById = new Map((recentProfiles ?? []).map((profile) => [profile.id, profile]));

  return NextResponse.json({
    currentAdmin: {
      role: auth.member.role,
      normalizedRole: auth.member.normalizedRole,
      name: auth.member.name,
    },
    stats: {
      totalOrders: orders.length,
      todayOrders: today.length,
      todayRevenue,
      totalRevenue,
      pendingOrders,
      newEnquiries: enquiryCount ?? 0,
      activeProducts: productCount ?? 0,
      lowStockProducts: lowStockCount ?? 0,
      totalConsultations: consultations?.length ?? 0,
      consultationRevenue: (consultations ?? [])
        .filter((consultation) => consultation.payment_status === 'captured')
        .reduce((sum, consultation) => sum + Number(consultation.amount_inr ?? 0), 0),
    },
    pipeline,
    paymentStatus,
    consultationStatus,
    consultationPayments,
    enquiryStatus,
    productAvailability,
    productCategories,
    teamRoles,
    chartData,
    lowStockProducts: lowStockProducts ?? [],
    recentOrders: (recentOrders ?? []).map((o) => {
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
  });
}
