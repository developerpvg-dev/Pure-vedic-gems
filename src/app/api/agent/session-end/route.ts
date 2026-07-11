import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAgentConfig, isAgentEnabled } from '@/lib/agent/config';
import { queueSessionFollowup } from '@/lib/agent/followup';
import { getAgentSession } from '@/lib/agent/session';
import { rateLimit } from '@/lib/utils/rate-limit';

const endSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  if (!isAgentEnabled()) {
    return NextResponse.json({ error: 'Agent is not enabled' }, { status: 503 });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!isCron && !rateLimit(`agent-session-end:${ip}`, 10, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = endSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const session = await getAgentSession(parsed.data.sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const result = await queueSessionFollowup(parsed.data.sessionId);
  return NextResponse.json({ ok: true, followup: result });
}

export async function GET() {
  return NextResponse.json({
    enabled: isAgentEnabled(),
    siteUrl: getAgentConfig().siteUrl,
  });
}
