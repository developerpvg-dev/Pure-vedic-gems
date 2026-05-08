import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

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

/**
 * GET /api/admin/designs
 * Returns all jewelry designs (admin view, includes inactive).
 * Supports ?setting_type=ring|pendant|bracelet filter.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const settingType = searchParams.get('setting_type');

  const supabase = createAdminClient();

  let query = supabase
    .from('jewelry_designs')
    .select('*')
    .order('setting_type')
    .order('sort_order', { ascending: true });

  if (settingType) {
    query = query.eq('setting_type', settingType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[admin/designs] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 });
  }

  return NextResponse.json({ designs: data ?? [] });
}

/**
 * POST /api/admin/designs
 * Create a new jewelry design.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();

    const { name, setting_type, image_url, description, making_charges, estimated_metal_weight, sort_order } = body;

    if (!name || !setting_type) {
      return NextResponse.json({ error: 'Name and setting type are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('jewelry_designs')
      .insert({
        name,
        setting_type,
        image_url: image_url || null,
        description: description || null,
        making_charges: making_charges || {},
        estimated_metal_weight: estimated_metal_weight || null,
        sort_order: sort_order ?? 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[admin/designs] Insert error:', error);
      return NextResponse.json({ error: 'Failed to create design' }, { status: 500 });
    }

    return NextResponse.json({ design: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

/**
 * PATCH /api/admin/designs
 * Update an existing jewelry design.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Design ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('jewelry_designs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[admin/designs] Update error:', error);
      return NextResponse.json({ error: 'Failed to update design' }, { status: 500 });
    }

    return NextResponse.json({ design: data });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

/**
 * DELETE /api/admin/designs
 * Soft-delete a design (set is_active=false).
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Design ID is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('jewelry_designs')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('[admin/designs] Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete design' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
