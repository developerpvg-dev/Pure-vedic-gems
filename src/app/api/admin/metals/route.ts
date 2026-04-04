import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  // Use admin client to bypass RLS on team_members
  const adminDb = createAdminClient();
  const { data: member } = await adminDb
    .from('team_members')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  const m = member as { role: string; is_active: boolean } | null;
  if (!m?.is_active) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user, role: m.role };
}

/**
 * GET /api/admin/metals
 * Returns ALL metals (including inactive) for admin management.
 */
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

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
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, slug, purity, price_per_gram, description, sort_order } = body as {
    name?: string; slug?: string; purity?: string; price_per_gram?: number;
    description?: string; sort_order?: number;
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
