import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/api';
import { listAgentSessionsForAdmin, listSessionMessages } from '@/lib/agent/session';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (sessionId) {
    const messages = await listSessionMessages(sessionId, 100);
    return NextResponse.json({ messages });
  }

  const sessions = await listAgentSessionsForAdmin(50);
  return NextResponse.json({ sessions });
}
