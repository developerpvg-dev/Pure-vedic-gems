import { createAdminClient } from '@/lib/supabase/admin';
import { createInviteToken, buildInviteUrl } from '@/lib/admin/team-invite';
import { sendTeamInviteEmail } from '@/lib/resend/send-team-invite';
import {
  ADMIN_ROLE_OPTIONS,
  ROLE_LABELS,
  normalizeAdminRole,
  type CanonicalAdminRole,
} from '@/lib/admin/rbac';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

export function getInviteRoles(inviterRole: string | null | undefined): CanonicalAdminRole[] {
  // Admins and Super Admins (owner) may invite a Super Admin; everyone else cannot.
  const role = normalizeAdminRole(inviterRole);
  if (role === 'owner' || role === 'admin') return [...ADMIN_ROLE_OPTIONS];
  return ADMIN_ROLE_OPTIONS.filter((r) => r !== 'owner');
}

export type SendTeamInvitationInput = {
  email: string;
  name: string;
  role: string;
  invitedByUserId: string;
  invitedByName?: string | null;
  invitedByRole?: string | null;
};

export type SendTeamInvitationResult =
  | { ok: true; inviteUrl: string; expiresAt: string; message: string }
  | { ok: false; status: number; error: string };

async function deliverInvite(params: {
  email: string;
  name: string;
  role: CanonicalAdminRole;
  invitedByUserId: string;
  invitedByName?: string | null;
}): Promise<SendTeamInvitationResult> {
  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  // Replace any still-pending invite for this email.
  await db.from('team_invitations').delete().eq('email', params.email).is('accepted_at', null);

  const { raw, hash, expiresAt } = createInviteToken();

  const { error } = await db.from('team_invitations').insert({
    email: params.email,
    name: params.name,
    role: params.role,
    token_hash: hash,
    expires_at: expiresAt.toISOString(),
    invited_by: params.invitedByUserId,
  });

  if (error) {
    return { ok: false, status: 500, error: 'Failed to create invitation' };
  }

  const inviteUrl = buildInviteUrl(raw);
  const roleLabel = ROLE_LABELS[params.role] ?? params.role;

  await sendTeamInviteEmail({
    to: params.email,
    name: params.name,
    roleLabel,
    inviteUrl,
    expiresMinutes: 15,
    invitedByName: params.invitedByName,
  });

  return {
    ok: true,
    inviteUrl,
    expiresAt: expiresAt.toISOString(),
    message: `Invitation sent to ${params.email}. The link expires in 15 minutes.`,
  };
}

export async function sendTeamInvitation({
  email,
  name,
  role,
  invitedByUserId,
  invitedByName,
  invitedByRole,
}: SendTeamInvitationInput): Promise<SendTeamInvitationResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();
  const normalizedRole = normalizeAdminRole(role);

  if (!normalizedEmail || !normalizedName) {
    return { ok: false, status: 400, error: 'email and name are required' };
  }
  if (!normalizedRole) {
    return { ok: false, status: 400, error: 'Invalid role' };
  }

  const allowedRoles = getInviteRoles(invitedByRole);
  if (!allowedRoles.includes(normalizedRole)) {
    return {
      ok: false,
      status: 403,
      error:
        normalizedRole === 'owner'
          ? 'Only a Super Admin can invite another Super Admin'
          : `Invalid role. Choose one of: ${allowedRoles.join(', ')}`,
    };
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existingUser = authUsers?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
  if (existingUser) {
    const { data: member } = await db.from('team_members').select('id').eq('id', existingUser.id).maybeSingle();
    if (member) {
      return { ok: false, status: 409, error: 'This email is already a team member' };
    }
  }

  return deliverInvite({
    email: normalizedEmail,
    name: normalizedName,
    role: normalizedRole,
    invitedByUserId,
    invitedByName,
  });
}

export async function resendTeamInvitation(
  invitationId: string,
  invitedByUserId: string,
  invitedByName?: string | null,
  invitedByRole?: string | null
): Promise<SendTeamInvitationResult> {
  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  const { data: invite } = await db
    .from<{
      id: string;
      email: string;
      name: string;
      role: string;
      accepted_at: string | null;
    }>('team_invitations')
    .select('id, email, name, role, accepted_at')
    .eq('id', invitationId)
    .maybeSingle();

  if (!invite || invite.accepted_at) {
    return { ok: false, status: 404, error: 'Pending invitation not found' };
  }

  const role = normalizeAdminRole(invite.role);
  if (!role) {
    return { ok: false, status: 400, error: 'Invitation has an invalid role' };
  }
  if (!getInviteRoles(invitedByRole).includes(role)) {
    return { ok: false, status: 403, error: 'You cannot resend this invitation' };
  }

  return deliverInvite({
    email: invite.email.toLowerCase(),
    name: invite.name,
    role,
    invitedByUserId,
    invitedByName,
  });
}

export async function revokeTeamInvitation(invitationId: string): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  const { data: invite } = await db
    .from<{ id: string; accepted_at: string | null }>('team_invitations')
    .select('id, accepted_at')
    .eq('id', invitationId)
    .maybeSingle();

  if (!invite || invite.accepted_at) {
    return { ok: false, status: 404, error: 'Pending invitation not found' };
  }

  const { error } = await db.from('team_invitations').delete().eq('id', invitationId);
  if (error) return { ok: false, status: 500, error: 'Failed to revoke invitation' };
  return { ok: true };
}
