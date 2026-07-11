import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, isStepCount, streamText, type UIMessage } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { assertAgentReady } from '@/lib/agent/config';
import {
  getAgentBusyMessage,
  isAgentCircuitOpen,
  recordAgentFailure,
  recordAgentSuccess,
} from '@/lib/agent/circuit-breaker';
import { maybeTriggerHandoff } from '@/lib/agent/handoff';
import { resolveSessionLocale } from '@/lib/agent/language';
import { getRatnaSystemPrompt } from '@/lib/agent/prompts';
import {
  getAgentSession,
  insertAgentMessage,
  listSessionMessages,
  updateAgentSession,
} from '@/lib/agent/session';
import { buildAgentTools } from '@/lib/agent/tools';
import { rateLimit } from '@/lib/utils/rate-limit';

const chatSchema = z.object({
  sessionId: z.string().uuid(),
  messages: z.array(z.custom<UIMessage>()),
});

export async function POST(request: NextRequest) {
  try {
    assertAgentReady();
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Agent unavailable' },
      { status: 503 }
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`agent-chat:${ip}`, 30, 60 * 1000)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid chat request' }, { status: 400 });
  }

  const { sessionId, messages } = parsed.data;
  const session = await getAgentSession(sessionId);
  if (!session || session.status === 'closed') {
    return Response.json({ error: 'Invalid or closed session' }, { status: 404 });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const lastText =
    lastUser?.parts
      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join(' ') ?? '';

  const history = await listSessionMessages(sessionId);
  const userMessageCount = history.filter((m) => m.role === 'user').length + 1;
  const locale = resolveSessionLocale(session.locale, lastText, userMessageCount);

  if (lastText) {
    await insertAgentMessage({
      sessionId,
      role: 'user',
      content: lastText,
      language: locale,
    });
  }

  await updateAgentSession(sessionId, { locale });

  if (isAgentCircuitOpen()) {
    const busy = getAgentBusyMessage(locale);
    await insertAgentMessage({ sessionId, role: 'assistant', content: busy, language: locale });
    return Response.json({ error: busy }, { status: 503 });
  }

  try {
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: getRatnaSystemPrompt(locale),
      messages: await convertToModelMessages(messages),
      tools: buildAgentTools(sessionId),
      stopWhen: isStepCount(5),
      onFinish: async ({ text }) => {
        recordAgentSuccess();
        if (text) {
          await insertAgentMessage({
            sessionId,
            role: 'assistant',
            content: text,
            language: locale,
          });
        }
        await maybeTriggerHandoff(sessionId);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    recordAgentFailure();
    console.error('[agent/chat]', err);
    return Response.json({ error: getAgentBusyMessage(locale) }, { status: 503 });
  }
}
