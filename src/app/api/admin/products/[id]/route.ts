import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { productUpdateSchema } from '@/lib/validators/product';

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

// ── GET: single product (admin view — includes inactive) ────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();
  const { data: product, error } = await admin
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({ product });
}

// ── PUT: update product ─────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const updatePayload = { ...parsed.data, updated_at: new Date().toISOString() };
  const { data: product, error } = await (admin
    .from('products') as ReturnType<typeof admin.from>)
    .update(updatePayload as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Duplicate SKU or slug' }, { status: 409 });
    }
    console.error('Product update error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }

  return NextResponse.json({ product });
}

// ── DELETE: soft-delete (deactivate) product ────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await (admin
    .from('products') as ReturnType<typeof admin.from>)
    .update({ is_active: false, updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to deactivate product' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
