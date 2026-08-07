import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { findAuthUserByEmail, hashInviteToken } from '@/lib/admin/team-invite';
import { ROLE_LABELS } from '@/lib/admin/rbac';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { rateLimit } from '@/lib/utils/rate-limit';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`invite-validate:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 });
  }

  const token = request.nextUrl.searchParams.get('token')?.trim();
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);
  const tokenHash = hashInviteToken(token);

  const { data: inviteRaw } = await db
    .from('team_invitations')
    .select('email, name, role, expires_at, accepted_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  const invite = inviteRaw as {
    email: string;
    name: string;
    role: string;
    expires_at: string;
    accepted_at: string | null;
  } | null;

  if (!invite) {
    return NextResponse.json({ error: 'Invalid or expired invitation link' }, { status: 404 });
  }

  if (invite.accepted_at) {
    return NextResponse.json({ error: 'This invitation has already been used' }, { status: 410 });
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'This invitation has expired. Ask your admin to send a new link.' }, { status: 410 });
  }

  let accountExists = false;
  try {
    accountExists = Boolean(await findAuthUserByEmail(admin, invite.email));
  } catch {
    // UI can still work; accept path will re-check
  }

  return NextResponse.json({
    email: invite.email,
    name: invite.name,
    role: invite.role,
    roleLabel: ROLE_LABELS[invite.role as keyof typeof ROLE_LABELS] ?? invite.role,
    expiresAt: invite.expires_at,
    accountExists,
  });
}
