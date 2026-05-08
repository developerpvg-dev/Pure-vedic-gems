import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hasAdminPermission, normalizeAdminRole, type AdminPermission } from '@/lib/admin/rbac';
import type { Json } from '@/lib/types/database';

export interface AdminAuthContext {
  user: { id: string; email?: string | null };
  member: {
    role: string;
    normalizedRole: string;
    name: string | null;
    permissions: Json;
  };
}

export async function requireAdminAccess(permission?: AdminPermission) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: member } = await admin
    .from('team_members')
    .select('role, name, is_active, permissions')
    .eq('id', user.id)
    .single();

  const typedMember = member as { role: string; name: string | null; is_active: boolean; permissions: Json } | null;
  const normalizedRole = normalizeAdminRole(typedMember?.role);

  if (!typedMember?.is_active || !normalizedRole) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  if (permission && !hasAdminPermission(typedMember.role, permission, typedMember.permissions)) {
    return { error: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }) };
  }

  return {
    user: { id: user.id, email: user.email },
    member: {
      role: typedMember.role,
      normalizedRole,
      name: typedMember.name,
      permissions: typedMember.permissions,
    },
  } satisfies AdminAuthContext;
}

export function getRequestIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
}