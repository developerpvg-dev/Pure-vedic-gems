import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAgentEnabled } from '@/lib/agent/config';
import { createAgentSession, getAgentSession } from '@/lib/agent/session';
import { rateLimit } from '@/lib/utils/rate-limit';

const VISITOR_COOKIE = 'ratna_visitor_id';

const createSchema = z.object({
  channel: z.enum(['chat', 'voice', 'phone', 'whatsapp']).optional(),
  locale: z.enum(['en', 'hi']).optional(),
  whatsappPhone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (!isAgentEnabled()) {
    return NextResponse.json({ error: 'Agent is not enabled' }, { status: 503 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`agent-session:${ip}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const jar = await cookies();
  let visitorId = jar.get(VISITOR_COOKIE)?.value;
  if (!visitorId) {
    visitorId = randomUUID();
  }

  const session = await createAgentSession({
    visitorId,
    channel: parsed.data.channel,
    locale: parsed.data.locale,
    whatsappPhone: parsed.data.whatsappPhone,
  });

  const res = NextResponse.json({ sessionId: session.id, visitorId, locale: session.locale });
  res.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
  return res;
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  const session = await getAgentSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: session.id,
    locale: session.locale,
    status: session.status,
    leadScore: session.lead_score,
    consentAt: session.consent_at,
  });
}
