import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

const ALLOWED_FIELDS = ['name', 'description', 'price', 'duration', 'includes', 'includes_video', 'sort_order', 'is_active'] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

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
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

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
