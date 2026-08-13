import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { findAuthUserByEmail, hashInviteToken } from '@/lib/admin/team-invite';
import { normalizeAdminRole } from '@/lib/admin/rbac';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { rateLimit } from '@/lib/utils/rate-limit';

function redirectForRole(role: string) {
  const acceptedRole = normalizeAdminRole(role);
  if (acceptedRole === 'designer') return '/admin/designer';
  if (acceptedRole === 'seo_cms') return '/admin/products';
  return '/admin';
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`invite-accept:${ip}`, 8, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as {
    token?: string;
    password?: string;
  } | null;

  const token = body?.token?.trim();
  const password = body?.password;

  if (!token) {
    return NextResponse.json({ error: 'Valid token is required' }, { status: 400 });
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

  let existingUser;
  try {
    existingUser = await findAuthUserByEmail(admin, invite.email);
  } catch {
    return NextResponse.json({ error: 'Could not verify account status' }, { status: 500 });
  }

  let userId = existingUser?.id ?? null;
  const existingAccount = Boolean(userId);

  if (!userId) {
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password (min 8 characters) is required' }, { status: 400 });
    }
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
  }
  // ponytail: never reset password for existing Auth users (invite-link takeover)

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
  } else {
    await db
      .from('team_members')
      .update({ is_active: true, role: invite.role, name: invite.name })
      .eq('id', userId);
  }

  await db
    .from('team_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  return NextResponse.json({
    success: true,
    existingAccount,
    redirectTo: redirectForRole(invite.role),
  });
}
