import type { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminFixedOtpRole, maskEmail, safeAdminNext } from '@/lib/admin/mfa';
import { sendAdminMfaOtpEmail } from '@/lib/resend/send-admin-mfa-otp';

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export type TeamMfaStartResult =
  | { required: false }
  | { required: true; userId: string; email: string; next?: string; mode: 'email' | 'fixed' }
  | { error: string };

/**
 * Generate Supabase email OTP via admin API (no Magic Link email),
 * then deliver the 6-digit code with Resend.
 */
async function sendSupabaseEmailOtpCode(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (error) {
    return { ok: false, error: error.message || 'Failed to generate verification code.' };
  }

  const code = data.properties?.email_otp;
  if (!code) {
    return {
      ok: false,
      error: 'Supabase did not return an email OTP. Enable email auth OTP in the project.',
    };
  }

  const sent = await sendAdminMfaOtpEmail({ to: email, code });
  if (!sent) {
    return {
      ok: false,
      error: 'Could not send verification email. Check RESEND_API_KEY is configured.',
    };
  }

  return { ok: true };
}

/**
 * If the user is an active team member: sign out, send 6-digit email OTP (Resend).
 * Customers: no-op ({ required: false }). Call while the password/OAuth session is still live.
 */
export async function startTeamEmailMfaIfNeeded(
  supabase: ServerSupabase,
  user: { id: string; email?: string | null },
  next?: string | null,
): Promise<TeamMfaStartResult> {
  if (!user.email) {
    return { error: 'Account has no email for verification.' };
  }

  const email = user.email;

  const admin = createAdminClient();
  const { data: member } = await admin
    .from('team_members')
    .select('is_active, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!member?.is_active) {
    return { required: false };
  }

  if (isAdminFixedOtpRole(member.role)) {
    return {
      required: true,
      userId: user.id,
      email,
      next: safeAdminNext(next),
      mode: 'fixed',
    };
  }

  const safeNext = safeAdminNext(next);

  await supabase.auth.signOut();

  const sent = await sendSupabaseEmailOtpCode(email);
  if (!sent.ok) {
    return { error: sent.error };
  }

  return { required: true, userId: user.id, email, next: safeNext, mode: 'email' };
}

export async function resendTeamEmailMfaCode(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  return sendSupabaseEmailOtpCode(email);
}

export { maskEmail };
