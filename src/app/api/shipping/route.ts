import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ShippingCountry, ShippingPlan } from '@/lib/types/shipping';
import {
  INTL_SHIPPING_ZONE,
  planAppliesToSubtotal,
  resolveShippingPlanCountry,
} from '@/lib/shipping/plans';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get('country')?.trim().toUpperCase() ?? null;
  const subtotalParam = request.nextUrl.searchParams.get('subtotal');
  const subtotal =
    subtotalParam != null && subtotalParam !== '' && Number.isFinite(Number(subtotalParam))
      ? Number(subtotalParam)
      : null;

  const admin = createAdminClient();

  const { data: countriesData, error: countriesError } = await admin
    .from('shipping_countries')
    .select('code, name, requires_indian_pincode, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (countriesError) {
    console.error('[shipping] countries fetch failed:', countriesError);
    return NextResponse.json({ error: 'Failed to load shipping countries' }, { status: 500 });
  }

  let plansQuery = admin
    .from('shipping_methods')
    .select(
      'id, label, description, cost, min_order_amount, max_order_amount, estimated_days_min, estimated_days_max, country_code, sort_order'
    )
    .eq('is_active', true)
    .gt('cost', 0)
    .order('sort_order', { ascending: true });

  if (country) {
    const planCountry = resolveShippingPlanCountry(country);
    plansQuery = plansQuery.eq('country_code', planCountry);
  }

  const { data: plansData, error: plansError } = await plansQuery;

  if (plansError) {
    console.error('[shipping] plans fetch failed:', plansError);
    return NextResponse.json({ error: 'Failed to load shipping plans' }, { status: 500 });
  }

  const countries = ((countriesData ?? []) as ShippingCountry[]).filter(
    (c) => c.code !== INTL_SHIPPING_ZONE
  );
  let plans = ((plansData ?? []) as ShippingPlan[]).filter((plan) => plan.country_code);

  if (subtotal != null) {
    plans = plans.filter((plan) => planAppliesToSubtotal(plan, subtotal));
  }

  return NextResponse.json(
    { countries, plans },
    {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    }
  );
}
