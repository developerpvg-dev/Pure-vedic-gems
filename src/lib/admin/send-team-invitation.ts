import { createAdminClient } from '@/lib/supabase/admin';
import { createInviteToken, buildInviteUrl } from '@/lib/admin/team-invite';
import { sendTeamInviteEmail } from '@/lib/resend/send-team-invite';
import { ADMIN_ROLE_OPTIONS, ROLE_LABELS } from '@/lib/admin/rbac';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

export const INVITE_ROLES = ADMIN_ROLE_OPTIONS.filter((role) => role !== 'owner');

export type SendTeamInvitationInput = {
  email: string;
  name: string;
  role: string;
  invitedByUserId: string;
  invitedByName?: string | null;
};

export type SendTeamInvitationResult =
  | { ok: true; inviteUrl: string; expiresAt: string; message: string }
  | { ok: false; status: number; error: string };

export async function sendTeamInvitation({
  email,
  name,
  role,
  invitedByUserId,
  invitedByName,
}: SendTeamInvitationInput): Promise<SendTeamInvitationResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();
  const normalizedRole = role.trim().toLowerCase();

  if (!normalizedEmail || !normalizedName) {
    return { ok: false, status: 400, error: 'email and name are required' };
  }
  if (!INVITE_ROLES.includes(normalizedRole as (typeof INVITE_ROLES)[number])) {
    return {
      ok: false,
      status: 400,
      error: `Invalid role. Choose one of: ${INVITE_ROLES.join(', ')}`,
    };
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  const { data: authUsers } = await admin.auth.admin.listUsers();
  const existingUser = authUsers?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
  if (existingUser) {
    const { data: member } = await db.from('team_members').select('id').eq('id', existingUser.id).maybeSingle();
    if (member) {
      return { ok: false, status: 409, error: 'This email is already a team member' };
    }
  }

  const { raw, hash, expiresAt } = createInviteToken();

  const { error } = await db.from('team_invitations').insert({
    email: normalizedEmail,
    name: normalizedName,
    role: normalizedRole,
    token_hash: hash,
    expires_at: expiresAt.toISOString(),
    invited_by: invitedByUserId,
  });

  if (error) {
    return { ok: false, status: 500, error: 'Failed to create invitation' };
  }

  const inviteUrl = buildInviteUrl(raw);
  const roleLabel = ROLE_LABELS[normalizedRole as keyof typeof ROLE_LABELS] ?? normalizedRole;

  await sendTeamInviteEmail({
    to: normalizedEmail,
    name: normalizedName,
    roleLabel,
    inviteUrl,
    expiresMinutes: 15,
    invitedByName,
  });

  return {
    ok: true,
    inviteUrl,
    expiresAt: expiresAt.toISOString(),
    message: `Invitation sent to ${normalizedEmail}. The link expires in 15 minutes.`,
  };
}
