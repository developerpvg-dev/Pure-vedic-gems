import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import {
  sendTeamInvitation,
  resendTeamInvitation,
  revokeTeamInvitation,
} from '@/lib/admin/send-team-invitation';
import { logAdminAction } from '@/lib/utils/admin-log';

function assertCanInvite(role: string) {
  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'Only Super Admins and Admins can manage invitations' }, { status: 403 });
  }
  return null;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('settings.team');
  if ('error' in auth) return auth.error;

  const denied = assertCanInvite(auth.member.normalizedRole);
  if (denied) return denied;

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
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminAccess('settings.team');
  if ('error' in auth) return auth.error;

  const denied = assertCanInvite(auth.member.normalizedRole);
  if (denied) return denied;

  const body = await request.json().catch(() => null) as { invitation_id?: string } | null;
  const invitationId = body?.invitation_id?.trim();
  if (!invitationId) {
    return NextResponse.json({ error: 'invitation_id required' }, { status: 400 });
  }

  const result = await resendTeamInvitation(
    invitationId,
    auth.user.id,
    auth.member.name,
    auth.member.normalizedRole
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await logAdminAction({
    userId: auth.user.id,
    action: 'team_invite_resent',
    resourceType: 'team_invitation',
    resourceId: invitationId,
    details: { expires_at: result.expiresAt },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({
    success: true,
    inviteUrl: result.inviteUrl,
    expiresAt: result.expiresAt,
    message: result.message,
  });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAccess('settings.team');
  if ('error' in auth) return auth.error;

  const denied = assertCanInvite(auth.member.normalizedRole);
  if (denied) return denied;

  const invitationId = request.nextUrl.searchParams.get('id')?.trim();
  if (!invitationId) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const result = await revokeTeamInvitation(invitationId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await logAdminAction({
    userId: auth.user.id,
    action: 'team_invite_revoked',
    resourceType: 'team_invitation',
    resourceId: invitationId,
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ success: true });
}
