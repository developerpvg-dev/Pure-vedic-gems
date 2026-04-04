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
 * PUT /api/admin/categories/[id]
 * Update a gem category.
 */
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

  // Build update object — only include fields that are present
  const update: Record<string, unknown> = {};
  const allowedFields = ['name', 'slug', 'type', 'sanskrit_name', 'planet', 'emoji', 'color', 'image_url', 'hover_image_url', 'description', 'sort_order', 'is_active'];

  for (const field of allowedFields) {
    if (field in body) {
      if (field === 'slug' && typeof body[field] === 'string') {
        update[field] = String(body[field]).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      } else if (field === 'type' && body[field] !== 'navaratna' && body[field] !== 'upratna') {
        return NextResponse.json({ error: 'type must be navaratna or upratna' }, { status: 400 });
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
    .from('gem_categories')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 409 });
    }
    if (error.code === 'PGRST204') {
      return NextResponse.json({
        error: 'Database schema is out of date. Please run the migration: ALTER TABLE gem_categories ADD COLUMN IF NOT EXISTS hover_image_url TEXT;',
        code: error.code,
      }, { status: 422 });
    }
    console.error('[admin/categories] Update error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }

  return NextResponse.json({ category: data });
}

/**
 * DELETE /api/admin/categories/[id]
 * Soft-delete: sets is_active = false.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;

  const admin = createAdminClient();
  const { error } = await admin
    .from('gem_categories')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('[admin/categories] Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
