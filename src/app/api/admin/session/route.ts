import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/api';

export async function GET() {
  const auth = await requireAdminAccess();
  if ('error' in auth) return auth.error;

  return NextResponse.json({
    role: auth.member.normalizedRole,
    name: auth.member.name,
  });
}
