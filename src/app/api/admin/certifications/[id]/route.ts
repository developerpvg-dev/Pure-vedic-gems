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

const ALLOWED_FIELDS = ['name', 'full_name', 'extra_charge', 'turnaround_days', 'sample_cert_url', 'description', 'is_default', 'sort_order', 'is_active'] as const;

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
    updates.name = String(updates.name).trim().substring(0, 20);
  }
  if ('full_name' in updates && updates.full_name) {
    updates.full_name = String(updates.full_name).trim().substring(0, 200);
  }
  if ('extra_charge' in updates && typeof updates.extra_charge === 'number' && updates.extra_charge < 0) {
    return NextResponse.json({ error: 'extra_charge must be non-negative' }, { status: 400 });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('certification_labs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[admin/certifications] Update error:', error);
    return NextResponse.json({ error: 'Failed to update certification' }, { status: 500 });
  }

  return NextResponse.json({ certification: data });
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
    .from('certification_labs')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('[admin/certifications] Delete error:', error);
    return NextResponse.json({ error: 'Failed to deactivate certification' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
