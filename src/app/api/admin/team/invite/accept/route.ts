import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashInviteToken } from '@/lib/admin/team-invite';
import { normalizeAdminRole } from '@/lib/admin/rbac';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    token?: string;
    password?: string;
  } | null;

  const token = body?.token?.trim();
  const password = body?.password;

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: 'Valid token and password (min 8 characters) are required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);
  const tokenHash = hashInviteToken(token);

  const { data: inviteRaw } = await db
    .from('team_invitations')
    .select('id, email, name, role, expires_at, accepted_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  const invite = inviteRaw as {
    id: string;
    email: string;
    name: string;
    role: string;
    expires_at: string;
    accepted_at: string | null;
  } | null;

  if (!invite || invite.accepted_at) {
    return NextResponse.json({ error: 'Invalid or used invitation' }, { status: 404 });
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Invitation expired' }, { status: 410 });
  }

  const { data: authUsers } = await admin.auth.admin.listUsers();
  const existingUser = authUsers?.users?.find((u) => u.email?.toLowerCase() === invite.email.toLowerCase());

  let userId = existingUser?.id;

  if (!userId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: invite.name },
    });
    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message || 'Failed to create account' }, { status: 500 });
    }
    userId = created.user.id;
  } else {
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password });
    if (updateError) {
      return NextResponse.json({ error: 'Account exists but password could not be set. Try logging in.' }, { status: 409 });
    }
  }

  const { data: existingMember } = await db.from('team_members').select('id').eq('id', userId).maybeSingle();
  if (!existingMember) {
    const { error: memberError } = await db.from('team_members').insert({
      id: userId,
      name: invite.name,
      role: invite.role,
      is_active: true,
      permissions: {},
    });
    if (memberError) {
      return NextResponse.json({ error: 'Failed to activate team membership' }, { status: 500 });
    }
  }

  await db
    .from('team_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  const acceptedRole = normalizeAdminRole(invite.role);

  return NextResponse.json({
    success: true,
    redirectTo: acceptedRole === 'designer' ? '/admin/designer' : '/admin',
  });
}
