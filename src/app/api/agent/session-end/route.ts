import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAgentConfig, isAgentEnabled } from '@/lib/agent/config';
import { closeRatnaSession } from '@/lib/agent/lead';
import { rateLimit } from '@/lib/utils/rate-limit';

const endSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  if (!isAgentEnabled()) {
    return NextResponse.json({ error: 'Agent is not enabled' }, { status: 503 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`agent-session-end:${ip}`, 10, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = endSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const result = await closeRatnaSession(parsed.data.sessionId);
  return NextResponse.json({ ok: true, lead: result });
}

export async function GET() {
  return NextResponse.json({
    enabled: isAgentEnabled(),
    siteUrl: getAgentConfig().siteUrl,
  });
}
