import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listAgentSessionsForAdmin, listSessionMessages } from '@/lib/agent/session';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: team } = await supabase
    .from('team_members')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!team) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (sessionId) {
    const messages = await listSessionMessages(sessionId, 100);
    return NextResponse.json({ messages });
  }

  const sessions = await listAgentSessionsForAdmin(50);
  return NextResponse.json({ sessions });
}
