import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireAdminAccess } from '@/lib/admin/api';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

export async function GET() {
  const auth = await requireAdminAccess('orders.design');
  if ('error' in auth) return auth.error;

  const db = asUntypedSupabase(createAdminClient());
  const { data } = await db
    .from('team_members')
    .select('name, avatar_url')
    .eq('id', auth.user.id)
    .maybeSingle();

  const member = data as { name: string; avatar_url?: string | null } | null;

  return NextResponse.json({
    name: member?.name ?? auth.member.name,
    email: auth.user.email ?? null,
    avatar_url: member?.avatar_url ?? null,
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminAccess('orders.design');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null) as { name?: string; avatar_url?: string | null } | null;
  const name = body?.name?.trim();

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const db = asUntypedSupabase(createAdminClient());
  const updates: Record<string, unknown> = { name };
  if (body?.avatar_url !== undefined) updates.avatar_url = body.avatar_url || null;

  const { error } = await db
    .from('team_members')
    .update(updates)
    .eq('id', auth.user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }

  return NextResponse.json({ success: true, name, avatar_url: updates.avatar_url ?? null });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('orders.design');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null) as {
    current_password?: string;
    new_password?: string;
  } | null;

  const currentPassword = body?.current_password;
  const newPassword = body?.new_password;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Current password and new password (min 8 chars) are required' }, { status: 400 });
  }

  const email = auth.user.email;
  if (!email) {
    return NextResponse.json({ error: 'Account email not found' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (verifyError) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error: updateError } = await admin.auth.admin.updateUserById(auth.user.id, {
    password: newPassword,
  });

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
