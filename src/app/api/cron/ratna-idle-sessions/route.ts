import { NextRequest, NextResponse } from 'next/server';
import { isAgentEnabled } from '@/lib/agent/config';
import { closeRatnaSession } from '@/lib/agent/lead';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

const IDLE_MINUTES = 30;
// ponytail: 10 per 5-minute run (each may make one AI call); raise if idle sessions start queueing up
const BATCH = 10;

/** Called by the 5-minute cron in cloudflare/worker.ts: closes abandoned Ratna chats and writes their lead notes. */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAgentEnabled()) return NextResponse.json({ ok: true, closed: 0 });

  const cutoff = new Date(Date.now() - IDLE_MINUTES * 60_000).toISOString();
  const { data, error } = await asUntypedSupabase(createAdminClient())
    .from('agent_sessions')
    .select('id')
    .in('status', ['active', 'handed_off'])
    .lt('updated_at', cutoff)
    .order('updated_at', { ascending: true })
    .limit(BATCH);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = await Promise.allSettled(
    ((data ?? []) as Array<{ id: string }>).map((s) => closeRatnaSession(s.id))
  );
  for (const r of results) if (r.status === 'rejected') console.error('[ratna-idle-sessions]', r.reason);
  return NextResponse.json({ ok: true, closed: results.filter((r) => r.status === 'fulfilled').length });
}
