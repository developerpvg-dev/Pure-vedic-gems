import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import { maskEmail, setAdminMfaPendingCookie } from '@/lib/admin/mfa';
import { startTeamEmailMfaIfNeeded } from '@/lib/admin/mfa-start';

/**
 * After password (or any) session: if active team member, drop session,
 * send Supabase email OTP, set pending cookie. Customers get { required: false }.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`admin-mfa-start:${ip}`, 8, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Wait a minute.' }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as { next?: string };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mfa = await startTeamEmailMfaIfNeeded(supabase, user, body.next);
  if ('error' in mfa) {
    return NextResponse.json({ error: mfa.error }, { status: 400 });
  }
  if (!mfa.required) {
    return NextResponse.json({ required: false });
  }

  const res = NextResponse.json({
    required: true,
    email: maskEmail(mfa.email),
    mode: mfa.mode,
  });
  setAdminMfaPendingCookie(res, {
    userId: mfa.userId,
    email: mfa.email,
    next: mfa.next,
    mode: mfa.mode,
  });
  return res;
}
