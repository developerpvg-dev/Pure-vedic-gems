import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { requireAdminAccess } from '@/lib/admin/api';
import { canViewFunnelMetrics } from '@/lib/leads/permissions';
import { LEAD_FUNNELS, type LeadFunnel } from '@/lib/leads/funnel';
import { emptyFunnelStage } from '@/lib/leads/funnel-aggregate';

/**
 * Lead funnel metrics — Postgres aggregates only (lead_funnel_metrics).
 * Defaults to last 30 days. Never pulls raw event/enquiry rows into Node.
 * Managers + SEO & CMS (read-only tracking).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;
  if (!canViewFunnelMetrics(auth.member.normalizedRole)) {
    return NextResponse.json({ error: 'Not allowed to view funnel metrics' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  const admin = createAdminClient();
  const { data, error } = await asUntypedSupabase(admin).rpc('lead_funnel_metrics', {
    p_date_from: dateFrom ? `${dateFrom}T00:00:00.000Z` : null,
    p_date_to: dateTo ? `${dateTo}T23:59:59.999Z` : null,
  });

  if (error) {
    console.error('[leads/funnels] rpc failed', error);
    return NextResponse.json({ error: 'Failed to load funnel metrics', detail: error.message }, { status: 500 });
  }

  const payload = (data ?? {}) as {
    funnels?: Record<string, ReturnType<typeof emptyFunnelStage>>;
    by_blog?: { slug: string; page_views: number; form_starts: number; drafts: number; submitted: number }[];
  };

  const funnels: Record<LeadFunnel, ReturnType<typeof emptyFunnelStage>> = {
    remedies: emptyFunnelStage(),
    contact: emptyFunnelStage(),
    consultation: emptyFunnelStage(),
    blog: emptyFunnelStage(),
  };
  for (const key of LEAD_FUNNELS) {
    const row = payload.funnels?.[key];
    if (row) funnels[key] = { ...emptyFunnelStage(), ...row };
  }

  return NextResponse.json({
    funnels,
    by_blog: payload.by_blog ?? [],
    as_of: new Date().toISOString(),
  });
}
