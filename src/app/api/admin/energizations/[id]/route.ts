import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

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

const ALLOWED_FIELDS = ['name', 'description', 'price', 'duration', 'includes', 'includes_video', 'sort_order', 'is_active'] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if ('name' in updates) {
    updates.name = String(updates.name).trim().substring(0, 100);
  }
  if ('price' in updates && typeof updates.price === 'number' && updates.price < 0) {
    return NextResponse.json({ error: 'price must be non-negative' }, { status: 400 });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('energization_options')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[admin/energizations] Update error:', error);
    return NextResponse.json({ error: 'Failed to update energization option' }, { status: 500 });
  }

  return NextResponse.json({ energization: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from('energization_options')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('[admin/energizations] Delete error:', error);
    return NextResponse.json({ error: 'Failed to deactivate energization option' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
