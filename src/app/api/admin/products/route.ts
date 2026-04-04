import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { productCreateSchema } from '@/lib/validators/product';

/**
 * Verify caller is an active team member.
 * Returns the user or a 403 response.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  // Use admin client to bypass RLS on team_members (circular RLS policy)
  const admin = createAdminClient();
  const { data: member } = await admin
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

// ── GET: list all products for admin (includes inactive) ────────────
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '20')));
  const search = searchParams.get('search')?.trim();
  const category = searchParams.get('category');

  const admin = createAdminClient();
  let query = admin
    .from('products')
    .select('id, sku, name, slug, category, sub_category, price, carat_weight, origin, in_stock, is_active, featured, images, created_at', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }
  if (category) {
    query = query.eq('category', category);
  }

  query = query.order('created_at', { ascending: false });

  const from = (page - 1) * perPage;
  query = query.range(from, from + perPage - 1);

  const { data: products, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }

  return NextResponse.json({
    products: products ?? [],
    total: count ?? 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
  });
}

// ── POST: create a product ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = productCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: product, error } = await (admin
    .from('products') as ReturnType<typeof admin.from>)
    .insert(parsed.data as Record<string, unknown>)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A product with this SKU or slug already exists' }, { status: 409 });
    }
    console.error('Product creation error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }

  return NextResponse.json({ product }, { status: 201 });
}
