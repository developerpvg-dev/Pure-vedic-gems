import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import {
  clearAdminMfaCookies,
  maskEmail,
  readAdminMfaPendingFromRequest,
  setAdminMfaPendingCookie,
} from '@/lib/admin/mfa';
import { startTeamEmailMfaIfNeeded } from '@/lib/admin/mfa-start';

/** Session present + team member → send OTP and clear session (OAuth / stale admin). */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`admin-mfa-challenge:${ip}`, 8, 60 * 1000)) {
    return NextResponse.redirect(new URL('/?auth=login', req.url));
  }

  const next = req.nextUrl.searchParams.get('next');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/?auth=login', req.url));
  }

  const mfa = await startTeamEmailMfaIfNeeded(supabase, user, next);
  const dest = new URL('/auth/admin-otp', req.url);

  if ('error' in mfa) {
    dest.searchParams.set('error', 'send_failed');
    const res = NextResponse.redirect(dest);
    clearAdminMfaCookies(res);
    return res;
  }

  if (!mfa.required) {
    return NextResponse.redirect(new URL('/account', req.url));
  }

  const res = NextResponse.redirect(dest);
  clearAdminMfaCookies(res);
  setAdminMfaPendingCookie(res, {
    userId: mfa.userId,
    email: mfa.email,
    next: mfa.next,
    mode: mfa.mode,
  });
  return res;
}

/** Pending cookie status for the OTP page (masked email only). */
export async function POST(req: NextRequest) {
  const pending = readAdminMfaPendingFromRequest(req);
  if (!pending) {
    return NextResponse.json({ pending: false }, { status: 400 });
  }
  return NextResponse.json({
    pending: true,
    email: maskEmail(pending.email),
    next: pending.next ?? '/admin',
    mode: pending.mode,
  });
}
