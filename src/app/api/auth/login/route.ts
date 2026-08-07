import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/lib/validators/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/utils/rate-limit';
import { logCustomerActivity } from '@/lib/customers/activity';
import {
  customerStatusBlockMessage,
  getCustomerAccountStatus,
  isCustomerAccountAccessible,
} from '@/lib/customers/account-status';
import { maskEmail, setAdminMfaPendingCookie } from '@/lib/admin/mfa';
import { startTeamEmailMfaIfNeeded } from '@/lib/admin/mfa-start';

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // 5 login attempts per minute per IP
  if (!rateLimit(`login:${ip}`, 5, 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // ── Email + Password ────────────────────────────────────────────────────────
  if (parsed.data.type === 'email') {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) {
      // Migrated-from-WordPress users don't know their temp password. If the
      // email belongs to a flagged legacy account, prompt them to set a new
      // password instead of showing a generic "invalid credentials" message.
      const admin = createAdminClient();
      const { data: legacyProfile } = await admin
        .from('customer_profiles')
        .select('requires_password_reset')
        .eq('email', parsed.data.email.toLowerCase())
        .maybeSingle();

      if (legacyProfile?.requires_password_reset) {
        return NextResponse.json(
          {
            error:
              'Your account was moved from our old site. Please set a new password to continue.',
            code: 'legacy_reset_required',
            reset_url: '/account/forgot-password',
          },
          { status: 401 }
        );
      }

      // Use a generic message to avoid user enumeration
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Active team members skip the customer-status gate (they may not shop).
    const admin = createAdminClient();
    const { data: teamMember } = await admin
      .from('team_members')
      .select('is_active')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!teamMember?.is_active) {
      const accountStatus = await getCustomerAccountStatus(data.user.id);
      if (!isCustomerAccountAccessible(accountStatus)) {
        await supabase.auth.signOut();
        return NextResponse.json(
          { error: customerStatusBlockMessage(accountStatus) },
          { status: 403 }
        );
      }

      void logCustomerActivity({
        customerId: data.user.id,
        eventType: 'login',
        title: 'Logged in',
        subtitle: data.user.email ?? 'Email sign-in',
        metadata: { method: 'email_password' },
      });

      const { data: profileRow } = await admin
        .from('customer_profiles')
        .select('requires_password_reset')
        .eq('id', data.user.id)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        requiresAdminOtp: false,
        requiresPasswordReset: Boolean(profileRow?.requires_password_reset),
        user: { id: data.user.id, email: data.user.email },
      });
    }

    // Team: password ok → email OTP (same cookie response as session clear)
    const mfa = await startTeamEmailMfaIfNeeded(supabase, data.user, '/admin');
    if ('error' in mfa) {
      return NextResponse.json({ error: mfa.error }, { status: 400 });
    }
    if (!mfa.required) {
      // shouldn't happen after team check; treat as normal
      return NextResponse.json({
        success: true,
        requiresAdminOtp: false,
        user: { id: data.user.id, email: data.user.email },
      });
    }

    const res = NextResponse.json({
      success: true,
      requiresAdminOtp: true,
      email: maskEmail(mfa.email),
    });
    setAdminMfaPendingCookie(res, {
      userId: mfa.userId,
      email: mfa.email,
      next: mfa.next,
    });
    return res;
  }

  // ── Phone OTP Request ───────────────────────────────────────────────────────
  if (parsed.data.type === 'otp_request') {
    const { error } = await supabase.auth.signInWithOtp({
      phone: parsed.data.phone,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      message: 'OTP sent to your phone number.',
    });
  }

  // ── Magic Link ──────────────────────────────────────────────────────────────
  if (parsed.data.type === 'magic_link') {
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/account`,
      },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      message: 'Magic link sent! Check your email inbox.',
    });
  }

  return NextResponse.json({ error: 'Invalid login type.' }, { status: 400 });
}
