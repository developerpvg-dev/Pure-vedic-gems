import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { ADMIN_ROLE_OPTIONS, ROLE_LABELS } from '@/lib/admin/rbac';
import { sendTeamInvitation, INVITE_ROLES } from '@/lib/admin/send-team-invitation';
import { logAdminAction } from '@/lib/utils/admin-log';

const VALID_ROLES = [...ADMIN_ROLE_OPTIONS];

export async function GET() {
  const auth = await requireAdminAccess('settings.team');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('team_members')
    .select('id, role, name, is_active, permissions, created_at')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to load team' }, { status: 500 });
  return NextResponse.json({
    members: data || [],
    roles: VALID_ROLES,
    inviteRoles: INVITE_ROLES,
    roleLabels: ROLE_LABELS,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('settings.team');
  if ('error' in auth) return auth.error;

  const normalizedRole = auth.member.normalizedRole;
  if (normalizedRole !== 'owner' && normalizedRole !== 'admin') {
    return NextResponse.json({ error: 'Only owners and admins can invite team members' }, { status: 403 });
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

  const update: Record<string, unknown> = {};
  if (body?.role !== undefined) {
    const role = body.role.trim().toLowerCase();
    if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    update.role = role;
  }
  if (body?.is_active !== undefined) update.is_active = Boolean(body.is_active);
  if (body?.permissions !== undefined) update.permissions = body.permissions;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const admin = createAdminClient();
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