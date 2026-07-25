import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { ADMIN_ROLE_OPTIONS, ROLE_LABELS, normalizeAdminRole } from '@/lib/admin/rbac';
import { sendTeamInvitation, getInviteRoles } from '@/lib/admin/send-team-invitation';
import { logAdminAction } from '@/lib/utils/admin-log';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

const VALID_ROLES = [...ADMIN_ROLE_OPTIONS];

export async function GET() {
  const auth = await requireAdminAccess('settings.team');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  type PendingInvite = {
    id: string;
    email: string;
    name: string;
    role: string;
    expires_at: string;
    accepted_at: string | null;
    created_at: string;
    invited_by: string | null;
  };

  const [{ data: members, error }, invitationsResult, authUsers] = await Promise.all([
    admin
      .from('team_members')
      .select('id, role, name, is_active, permissions, created_at')
      .order('created_at', { ascending: true }),
    db
      .from<PendingInvite>('team_invitations')
      .select('id, email, name, role, expires_at, accepted_at, created_at, invited_by')
      .is('accepted_at', null)
      .order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (error) return NextResponse.json({ error: 'Failed to load team' }, { status: 500 });

  const emailById = new Map(
    (authUsers.data?.users ?? []).map((user) => [user.id, user.email?.toLowerCase() ?? null])
  );

  const invitationRows = (Array.isArray(invitationsResult.data)
    ? invitationsResult.data
    : invitationsResult.data
      ? [invitationsResult.data]
      : []) as PendingInvite[];

  const now = Date.now();
  const pendingInvitations = invitationRows.map((invite) => ({
    ...invite,
    status: new Date(invite.expires_at).getTime() < now ? 'expired' : 'pending',
  }));

  return NextResponse.json({
    members: (members || []).map((member) => ({
      ...member,
      email: emailById.get(member.id) ?? null,
    })),
    invitations: pendingInvitations,
    roles: VALID_ROLES,
    inviteRoles: getInviteRoles(auth.member.normalizedRole),
    roleLabels: ROLE_LABELS,
    currentUser: {
      id: auth.user.id,
      role: auth.member.normalizedRole,
      email: auth.user.email ?? null,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('settings.team');
  if ('error' in auth) return auth.error;

  const normalizedRole = auth.member.normalizedRole;
  if (normalizedRole !== 'owner' && normalizedRole !== 'admin') {
    return NextResponse.json({ error: 'Only Super Admins and Admins can invite team members' }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { email?: string; name?: string; role?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? '';
  const name = body?.name?.trim() ?? '';
  const role = body?.role?.trim().toLowerCase() || 'sales';

  const result = await sendTeamInvitation({
    email,
    name,
    role,
    invitedByUserId: auth.user.id,
    invitedByName: auth.member.name,
    invitedByRole: auth.member.normalizedRole,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await logAdminAction({
    userId: auth.user.id,
    action: 'team_invite_sent',
    resourceType: 'team_invitation',
    resourceId: email,
    details: { email, name, role, expires_at: result.expiresAt },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({
    success: true,
    inviteUrl: result.inviteUrl,
    expiresAt: result.expiresAt,
    message: result.message,
  }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminAccess('settings.team');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null) as {
    member_id?: string;
    role?: string;
    is_active?: boolean;
    permissions?: Record<string, unknown>;
  } | null;
  const memberId = body?.member_id;

  if (!memberId) return NextResponse.json({ error: 'member_id required' }, { status: 400 });
  if (memberId === auth.user.id && body?.is_active === false) {
    return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: target } = await admin
    .from('team_members')
    .select('id, role, is_active')
    .eq('id', memberId)
    .maybeSingle();

  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  const targetRole = normalizeAdminRole(target.role);
  // Admin has the same authority as Super Admin (owner).
  const actorCanManageOwner =
    auth.member.normalizedRole === 'owner' || auth.member.normalizedRole === 'admin';

  if (targetRole === 'owner' && !actorCanManageOwner) {
    return NextResponse.json({ error: 'Only a Super Admin can change another Super Admin' }, { status: 403 });
  }

  const update: Record<string, unknown> = {};
  if (body?.role !== undefined) {
    const role = body.role.trim().toLowerCase();
    if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (role === 'owner' && !actorCanManageOwner) {
      return NextResponse.json({ error: 'Only a Super Admin can assign the Super Admin role' }, { status: 403 });
    }
    if (memberId === auth.user.id && targetRole === 'owner' && role !== 'owner') {
      return NextResponse.json({ error: 'Cannot demote yourself from Super Admin' }, { status: 400 });
    }
    update.role = role;
  }
  if (body?.is_active !== undefined) update.is_active = Boolean(body.is_active);
  if (body?.permissions !== undefined) update.permissions = body.permissions;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  // Keep at least one active Super Admin.
  const willDeactivateOwner =
    targetRole === 'owner' &&
    target.is_active &&
    (update.is_active === false || (typeof update.role === 'string' && update.role !== 'owner'));
  if (willDeactivateOwner) {
    const { data: activeMembers } = await admin
      .from('team_members')
      .select('id, role')
      .eq('is_active', true);
    const activeOwners = (activeMembers ?? []).filter((m) => normalizeAdminRole(m.role) === 'owner');
    if (activeOwners.length <= 1) {
      return NextResponse.json({ error: 'Cannot remove the last active Super Admin' }, { status: 400 });
    }
  }

  const { error } = await admin.from('team_members').update(update).eq('id', memberId);
  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

  await logAdminAction({
    userId: auth.user.id,
    action: 'team_member_update',
    resourceType: 'team_member',
    resourceId: memberId,
    details: update,
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ success: true });
}
