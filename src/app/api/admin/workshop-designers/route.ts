import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

/**
 * GET /api/admin/workshop-designers — name-only workshop roster
 * POST { name } — add designer by name
 * DELETE ?id= — soft-deactivate
 */
export async function GET() {
  const auth = await requireAdminAccess('orders.write');
  if ('error' in auth) return auth.error;

  const db = asUntypedSupabase(createAdminClient());
  const { data, error } = await db
    .from('workshop_designers')
    .select('id, name, is_active, created_at')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    // ponytail: table may not exist until week35 SQL is applied
    if (error.message?.includes('workshop_designers') || error.code === '42P01' || error.code === 'PGRST205') {
      return NextResponse.json({ designers: [], needsMigration: true });
    }
    return NextResponse.json({ error: 'Failed to load workshop designers' }, { status: 500 });
  }

  return NextResponse.json({ designers: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('orders.write');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null) as { name?: string } | null;
  const name = body?.name?.trim().replace(/\s+/g, ' ') ?? '';
  if (!name || name.length > 200) {
    return NextResponse.json({ error: 'Designer name is required' }, { status: 400 });
  }

  const db = asUntypedSupabase(createAdminClient());

  // Re-activate if name already exists
  const { data: existing } = await db
    .from('workshop_designers')
    .select('id, name, is_active')
    .ilike('name', name)
    .maybeSingle();

  if (existing) {
    const row = existing as { id: string; name: string; is_active: boolean };
    if (!row.is_active) {
      await db.from('workshop_designers').update({ is_active: true }).eq('id', row.id);
    }
    return NextResponse.json({ designer: { id: row.id, name: row.name, is_active: true } });
  }

  const { data, error } = await db
    .from('workshop_designers')
    .insert({ name })
    .select('id, name, is_active, created_at')
    .single();

  if (error) {
    if (error.message?.includes('workshop_designers') || error.code === '42P01' || error.code === 'PGRST205') {
      return NextResponse.json(
        { error: 'Run supabase/week35_workshop_designers.sql in Supabase first' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message || 'Failed to add designer' }, { status: 500 });
  }

  return NextResponse.json({ designer: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAccess('orders.write');
  if ('error' in auth) return auth.error;

  const id = request.nextUrl.searchParams.get('id')?.trim();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = asUntypedSupabase(createAdminClient());
  const { error } = await db
    .from('workshop_designers')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove designer' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
