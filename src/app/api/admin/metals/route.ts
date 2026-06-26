import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

/**
 * GET /api/admin/metals
 * Returns ALL metals (including inactive) for admin management.
 */
export async function GET() {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('metals')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch metals' }, { status: 500 });
  }

  return NextResponse.json({ metals: data ?? [] });
}

/**
 * POST /api/admin/metals
 * Create a new metal.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, slug, purity, price_per_gram, description, sort_order, labor_rate_percent, pricing_mode, gst_rate_percent } = body as {
    name?: string; slug?: string; purity?: string; price_per_gram?: number;
    description?: string; sort_order?: number;
    labor_rate_percent?: number | null;
    pricing_mode?: string;
    gst_rate_percent?: number | null;
  };

  if (!name || !slug || typeof price_per_gram !== 'number') {
    return NextResponse.json({ error: 'name, slug, and price_per_gram are required' }, { status: 400 });
  }

  if (price_per_gram < 0) {
    return NextResponse.json({ error: 'price_per_gram must be non-negative' }, { status: 400 });
  }

  const safeSlug = String(slug).toLowerCase().replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('metals')
    .insert({
      name: String(name).trim(),
      slug: safeSlug,
      purity: purity ? String(purity).trim() : null,
      price_per_gram,
      description: description ? String(description).trim() : null,
      sort_order: typeof sort_order === 'number' ? sort_order : 0,
      pricing_mode: pricing_mode === 'fixed_sheet' ? 'fixed_sheet' : 'weight',
      labor_rate_percent:
        labor_rate_percent == null
          ? null
          : typeof labor_rate_percent === 'number'
            ? labor_rate_percent
            : null,
      gst_rate_percent:
        gst_rate_percent == null
          ? null
          : typeof gst_rate_percent === 'number'
            ? gst_rate_percent
            : null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A metal with this slug already exists' }, { status: 409 });
    }
    console.error('[admin/metals] Create error:', error);
    return NextResponse.json({ error: 'Failed to create metal' }, { status: 500 });
  }

  return NextResponse.json({ metal: data }, { status: 201 });
}
