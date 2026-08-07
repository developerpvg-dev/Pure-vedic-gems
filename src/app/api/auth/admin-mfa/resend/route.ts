import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import {
  maskEmail,
  readAdminMfaPendingFromRequest,
  setAdminMfaPendingCookie,
} from '@/lib/admin/mfa';
import { resendTeamEmailMfaCode } from '@/lib/admin/mfa-start';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`admin-mfa-resend:${ip}`, 3, 60 * 1000)) {
    return NextResponse.json({ error: 'Wait a minute before requesting another code.' }, { status: 429 });
  }

  const pending = readAdminMfaPendingFromRequest(req);
  if (!pending) {
    return NextResponse.json({ error: 'Verification expired. Sign in again.' }, { status: 400 });
  }

  const sent = await resendTeamEmailMfaCode(pending.email);
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error }, { status: 400 });
  }

  const res = NextResponse.json({
    success: true,
    email: maskEmail(pending.email),
  });
  // refresh pending TTL
  setAdminMfaPendingCookie(res, {
    userId: pending.userId,
    email: pending.email,
    next: pending.next,
  });
  return res;
}
