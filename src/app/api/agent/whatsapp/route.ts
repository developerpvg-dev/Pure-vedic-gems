import { NextRequest, NextResponse } from 'next/server';
import { getAgentConfig, isAgentEnabled } from '@/lib/agent/config';
import { resolveSessionLocale } from '@/lib/agent/language';
import { createAgentSession, getAgentSession, insertAgentMessage } from '@/lib/agent/session';
import {
  extractWhatsAppMessages,
  isDuplicateWebhook,
  sendWhatsAppText,
  verifyWhatsAppSignature,
} from '@/lib/agent/whatsapp';
import { rateLimit } from '@/lib/utils/rate-limit';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const { whatsapp } = getAgentConfig();
  if (mode === 'subscribe' && token === whatsapp.verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  if (!isAgentEnabled()) {
    return NextResponse.json({ ok: true });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  if (!verifyWhatsAppSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const messages = extractWhatsAppMessages(payload);

  for (const msg of messages) {
    if (await isDuplicateWebhook('whatsapp', msg.id)) continue;

    const phone = msg.from;
    if (!rateLimit(`wa:${phone}`, 20, 60 * 1000)) {
      await sendWhatsAppText(phone, 'Please wait a moment before sending more messages.').catch(() => null);
      continue;
    }

    let session = await findWhatsAppSession(phone);
    if (!session) {
      session = await createAgentSession({
        visitorId: `wa:${phone}`,
        channel: 'whatsapp',
        locale: resolveSessionLocale('en', msg.text, 1),
        whatsappPhone: phone,
      });
    }

    await insertAgentMessage({
      sessionId: session.id,
      role: 'user',
      content: msg.text,
      language: resolveSessionLocale(session.locale, msg.text, 1),
    });

    const reply = await runWhatsAppAgentReply(session.id, msg.text);
    await sendWhatsAppText(phone, reply).catch((err) => {
      console.error('[whatsapp] send failed', err);
    });
  }

  return NextResponse.json({ ok: true });
}

async function findWhatsAppSession(phone: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient() as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (col: string, val: string) => {
          eq: (col2: string, val2: string) => {
            order: (col3: string, opts: { ascending: boolean }) => {
              limit: (n: number) => {
                maybeSingle: () => Promise<{ data: Record<string, unknown> | null }>;
              };
            };
          };
        };
      };
    };
  };

  const { data } = await admin
    .from('agent_sessions')
    .select('*')
    .eq('whatsapp_phone', phone)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return getAgentSession(String(data.id));
}

async function runWhatsAppAgentReply(sessionId: string, userText: string): Promise<string> {
  const { openai } = await import('@ai-sdk/openai');
  const { generateText, isStepCount } = await import('ai');
  const { getRatnaSystemPrompt } = await import('@/lib/agent/prompts');
  const { buildAgentTools } = await import('@/lib/agent/tools');
  const { getAgentSession, insertAgentMessage } = await import('@/lib/agent/session');
  const { maybeTriggerHandoff } = await import('@/lib/agent/handoff');

  const session = await getAgentSession(sessionId);
  if (!session) return 'Session expired. Please message again.';

  const locale = session.locale;
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: getRatnaSystemPrompt(locale),
    prompt: userText,
    tools: buildAgentTools(sessionId),
    stopWhen: isStepCount(4),
  });

  await insertAgentMessage({
    sessionId,
    role: 'assistant',
    content: text,
    language: locale,
  });
  await maybeTriggerHandoff(sessionId);
  return text;
}
