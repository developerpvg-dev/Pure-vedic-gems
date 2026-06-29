import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { sendTeamInvitation } from '@/lib/admin/send-team-invitation';
import { logAdminAction } from '@/lib/utils/admin-log';

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('settings.team');
  if ('error' in auth) return auth.error;

  const normalizedRole = auth.member.normalizedRole;
  if (normalizedRole !== 'owner' && normalizedRole !== 'admin') {
    return NextResponse.json({ error: 'Only owners and admins can send invitations' }, { status: 403 });
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
  });
}
