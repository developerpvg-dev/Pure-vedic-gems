import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/utils/rate-limit';
import {
  ADMIN_MFA_PENDING_COOKIE,
  readAdminMfaPendingFromRequest,
  setAdminMfaCookie,
} from '@/lib/admin/mfa';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`admin-mfa-verify:${ip}`, 8, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Wait a minute.' }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim();
  if (!token || token.length < 6) {
    return NextResponse.json({ error: 'Enter the 6-digit code from your email.' }, { status: 400 });
  }

  const pending = readAdminMfaPendingFromRequest(req);
  if (!pending) {
    return NextResponse.json(
      { error: 'Verification expired. Sign in again.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: pending.email,
    token,
    type: 'email',
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: 'Invalid or expired code. Try again.' },
      { status: 400 },
    );
  }

  if (data.user.id !== pending.userId) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: 'Verification failed.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: member } = await admin
    .from('team_members')
    .select('is_active')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!member?.is_active) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: 'Not an active team member.' }, { status: 403 });
  }

  const res = NextResponse.json({
    success: true,
    redirectTo: pending.next || '/admin',
  });
  res.cookies.set({ name: ADMIN_MFA_PENDING_COOKIE, value: '', path: '/', maxAge: 0 });
  setAdminMfaCookie(res, data.user.id);
  return res;
}
