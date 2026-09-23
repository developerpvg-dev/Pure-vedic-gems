import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { requireAdminAccess } from '@/lib/admin/api';

/**
 * Product journey metrics — Postgres aggregates only (product_funnel_metrics).
 * Defaults to last 30 days when dates omitted. Never pulls raw event rows.
 * SEO & CMS: abandoned checkout contact fields redacted.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  const admin = createAdminClient();
  const { data, error } = await asUntypedSupabase(admin).rpc('product_funnel_metrics', {
    p_date_from: dateFrom ? `${dateFrom}T00:00:00.000Z` : null,
    p_date_to: dateTo ? `${dateTo}T23:59:59.999Z` : null,
  });

  if (error) {
    console.error('[commerce/product-funnels] rpc failed', error);
    return NextResponse.json({ error: 'Failed to load product journey', detail: error.message }, { status: 500 });
  }

  const payload = (data ?? {}) as Record<string, unknown>;
  let abandoned = (payload.abandoned_checkouts ?? []) as Record<string, unknown>[];
  if (auth.member.normalizedRole === 'seo_cms') {
    abandoned = abandoned.map((row) => ({
      id: row.id,
      step: row.step,
      updated_at: row.updated_at,
      // ponytail: SEO sees abandon counts/timing only — no contact PII
      full_name: null,
      email: null,
      phone: null,
    }));
  }

  return NextResponse.json({
    summary: payload.summary ?? {},
    top_categories: payload.top_categories ?? [],
    top_products: payload.top_products ?? [],
    whatsapp_by_source: payload.whatsapp_by_source ?? [],
    call_by_source: payload.call_by_source ?? [],
    abandoned_checkouts: abandoned,
    as_of: new Date().toISOString(),
  });
}
