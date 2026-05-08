import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { ADMIN_ROLE_OPTIONS, ROLE_LABELS } from '@/lib/admin/rbac';
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
  return NextResponse.json({ members: data || [], roles: VALID_ROLES, roleLabels: ROLE_LABELS });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('settings.team');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null) as { email?: string; name?: string; role?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const name = body?.name?.trim();
  const role = body?.role?.trim().toLowerCase();

  if (!email || !name || !role) {
    return NextResponse.json({ error: 'email, name, and role required' }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
  if (listError) return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });

  const user = users.find((candidate) => candidate.email?.toLowerCase() === email);
  if (!user) {
    return NextResponse.json({ error: 'No user account found with this email. They must sign up first.' }, { status: 404 });
  }

  const { data: existing } = await admin.from('team_members').select('id').eq('id', user.id).maybeSingle();
  if (existing) return NextResponse.json({ error: 'This user is already a team member' }, { status: 409 });

  const { error } = await admin.from('team_members').insert({
    id: user.id,
    name,
    role,
    is_active: true,
    permissions: {},
  });

  if (error) return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });

  await logAdminAction({
    userId: auth.user.id,
    action: 'team_member_add',
    resourceType: 'team_member',
    resourceId: user.id,
    details: { email, name, role },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ success: true }, { status: 201 });
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