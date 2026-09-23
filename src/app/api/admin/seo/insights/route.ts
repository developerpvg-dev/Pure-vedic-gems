import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { requireAdminAccess } from '@/lib/admin/api';
import { canViewFunnelMetrics } from '@/lib/leads/permissions';

type OrderRow = {
  order_number: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  order_source?: string | null;
  items: unknown;
};

type LeadRow = {
  source: string | null;
  enquiry_type: string | null;
  is_draft: boolean | null;
  created_at: string;
};

type SlimItem = {
  name: string;
  sku: string | null;
  quantity: number;
  line_total: number | null;
  design: string | null;
};

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function slimItems(raw: unknown): SlimItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 12).map((row) => {
    const item = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>;
    const snap =
      item.configuration_snapshot && typeof item.configuration_snapshot === 'object'
        ? (item.configuration_snapshot as Record<string, unknown>)
        : null;
    const design =
      (typeof item.design_name === 'string' && item.design_name) ||
      (typeof item.configuration_summary === 'string' && item.configuration_summary) ||
      (snap && typeof snap.design_name === 'string' && snap.design_name) ||
      null;
    return {
      name: typeof item.name === 'string' ? item.name.slice(0, 200) : 'Item',
      sku: typeof item.sku === 'string' ? item.sku.slice(0, 80) : null,
      quantity: typeof item.quantity === 'number' ? item.quantity : 1,
      line_total: typeof item.line_total === 'number' ? item.line_total : null,
      design: design ? String(design).slice(0, 160) : null,
    };
  });
}

/**
 * Anonymized order + lead aggregates for SEO & CMS (no customer name/email/phone).
 * Defaults to last 30 days. Never selects guest_* / customer profile fields.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;
  if (!canViewFunnelMetrics(auth.member.normalizedRole)) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const dFrom = dateFrom ? `${dateFrom}T00:00:00.000Z` : new Date(Date.now() - 30 * 864e5).toISOString();
  const dTo = dateTo ? `${dateTo}T23:59:59.999Z` : new Date().toISOString();

  const db = asUntypedSupabase(createAdminClient());

  // ponytail: narrow columns only — never guest_email/name/phone/shipping_address
  const [ordersRes, leadsRes] = await Promise.all([
    db
      .from('orders')
      .select('order_number, total, status, payment_status, created_at, order_source, items')
      .gte('created_at', dFrom)
      .lte('created_at', dTo)
      .order('created_at', { ascending: false })
      .limit(2000),
    db
      .from('enquiries')
      .select('source, enquiry_type, is_draft, created_at')
      .gte('created_at', dFrom)
      .lte('created_at', dTo)
      .order('created_at', { ascending: false })
      .limit(5000),
  ]);

  if (ordersRes.error) {
    console.error('[seo/insights] orders', ordersRes.error);
    return NextResponse.json({ error: 'Failed to load order insights' }, { status: 500 });
  }
  if (leadsRes.error) {
    console.error('[seo/insights] leads', leadsRes.error);
    return NextResponse.json({ error: 'Failed to load lead insights' }, { status: 500 });
  }

  const orders = (ordersRes.data ?? []) as OrderRow[];
  const leads = (leadsRes.data ?? []) as LeadRow[];

  const paid = orders.filter(
    (o) => o.payment_status === 'captured' || o.payment_status === 'partial'
  );
  const revenue = paid.reduce((s, o) => s + (o.total ?? 0), 0);
  const orderCount = orders.length;
  const aov = paid.length ? revenue / paid.length : 0;

  const byDayOrders = new Map<string, { orders: number; revenue: number }>();
  const productMap = new Map<string, { name: string; sku: string | null; units: number; revenue: number }>();
  const designMap = new Map<string, number>();

  for (const o of orders) {
    const day = dayKey(o.created_at);
    const bucket = byDayOrders.get(day) ?? { orders: 0, revenue: 0 };
    bucket.orders += 1;
    if (o.payment_status === 'captured' || o.payment_status === 'partial') {
      bucket.revenue += o.total ?? 0;
    }
    byDayOrders.set(day, bucket);

    for (const item of slimItems(o.items)) {
      const key = item.sku || item.name;
      const prev = productMap.get(key) ?? { name: item.name, sku: item.sku, units: 0, revenue: 0 };
      prev.units += item.quantity;
      prev.revenue += item.line_total ?? 0;
      productMap.set(key, prev);
      if (item.design) designMap.set(item.design, (designMap.get(item.design) ?? 0) + item.quantity);
    }
  }

  const bySource = new Map<string, { total: number; drafts: number; submitted: number }>();
  const byDayLeads = new Map<string, number>();
  for (const lead of leads) {
    const source = lead.source?.trim() || 'unknown';
    const bucket = bySource.get(source) ?? { total: 0, drafts: 0, submitted: 0 };
    bucket.total += 1;
    if (lead.is_draft) bucket.drafts += 1;
    else bucket.submitted += 1;
    bySource.set(source, bucket);
    const day = dayKey(lead.created_at);
    byDayLeads.set(day, (byDayLeads.get(day) ?? 0) + 1);
  }

  return NextResponse.json({
    orders: {
      summary: {
        order_count: orderCount,
        paid_count: paid.length,
        revenue: Math.round(revenue),
        aov: Math.round(aov),
      },
      by_day: Array.from(byDayOrders.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, orders: v.orders, revenue: Math.round(v.revenue) })),
      recent: orders.slice(0, 50).map((o) => ({
        order_number: o.order_number,
        created_at: o.created_at,
        total: o.total,
        status: o.status,
        payment_status: o.payment_status,
        order_source: o.order_source || 'online',
        items: slimItems(o.items),
      })),
      top_products: Array.from(productMap.values())
        .sort((a, b) => b.units - a.units)
        .slice(0, 30),
      top_designs: Array.from(designMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([design, units]) => ({ design, units })),
    },
    leads: {
      summary: {
        total: leads.length,
        drafts: leads.filter((l) => l.is_draft).length,
        submitted: leads.filter((l) => !l.is_draft).length,
      },
      by_source: Array.from(bySource.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .map(([source, v]) => ({ source, ...v })),
      by_day: Array.from(byDayLeads.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
    },
    as_of: new Date().toISOString(),
  });
}
