import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

/**
 * PUT /api/admin/metals/[id]
 * Update a metal (including price).
 */
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

  const update: Record<string, unknown> = {};
  const allowedFields = ['name', 'slug', 'purity', 'price_per_gram', 'description', 'sort_order', 'is_active'];

  for (const field of allowedFields) {
    if (field in body) {
      if (field === 'slug' && typeof body[field] === 'string') {
        update[field] = String(body[field]).toLowerCase().replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      } else if (field === 'price_per_gram') {
        const price = Number(body[field]);
        if (isNaN(price) || price < 0) {
          return NextResponse.json({ error: 'price_per_gram must be a non-negative number' }, { status: 400 });
        }
        update[field] = price;
      } else {
        update[field] = body[field];
      }
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('metals')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A metal with this slug already exists' }, { status: 409 });
    }
    console.error('[admin/metals] Update error:', error);
    return NextResponse.json({ error: 'Failed to update metal' }, { status: 500 });
  }

  return NextResponse.json({ metal: data });
}

/**
 * DELETE /api/admin/metals/[id]
 * Soft-delete: sets is_active = false.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  const { id } = await params;

  const admin = createAdminClient();
  const { error } = await admin
    .from('metals')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('[admin/metals] Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete metal' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
