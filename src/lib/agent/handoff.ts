import { getAgentConfig } from '@/lib/agent/config';
import { computeLeadScore } from '@/lib/agent/lead-scorer';
import { getAgentSession, listSessionMessages, updateAgentSession } from '@/lib/agent/session';
import { sendEnquiryEmails } from '@/lib/resend/send-enquiry';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { sendWhatsAppText } from '@/lib/agent/whatsapp';

export async function createChatwootConversation(input: {
  name: string;
  email?: string;
  phone?: string;
  message: string;
  sessionId: string;
}) {
  const { chatwoot } = getAgentConfig();
  if (!chatwoot.baseUrl || !chatwoot.apiToken || !chatwoot.inboxId) {
    return { ok: false, reason: 'chatwoot_not_configured' };
  }

  const res = await fetch(`${chatwoot.baseUrl}/api/v1/accounts/1/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      api_access_token: chatwoot.apiToken,
    },
    body: JSON.stringify({
      source_id: input.sessionId,
      inbox_id: Number(chatwoot.inboxId),
      contact: {
        name: input.name,
        email: input.email,
        phone_number: input.phone,
      },
      message: { content: input.message },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, reason: err };
  }

  const data = (await res.json()) as { id?: number };
  return { ok: true, conversationId: data.id };
}

export async function triggerHotLeadHandoff(sessionId: string, reason?: string) {
  const session = await getAgentSession(sessionId);
  if (!session) return { ok: false, reason: 'session_not_found' };

  const messages = await listSessionMessages(sessionId, 30);
  const transcript = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')
    .slice(0, 4000);

  const name = session.context.name ?? 'Website visitor';
  const email = session.context.email;
  const phone = session.context.phone ?? session.whatsapp_phone ?? undefined;
  const summary = [
    `Ratna AI handoff (score ${session.lead_score})`,
    reason ? `Reason: ${reason}` : null,
    email ? `Email: ${email}` : null,
    phone ? `Phone: ${phone}` : null,
    '',
    'Transcript:',
    transcript,
  ]
    .filter(Boolean)
    .join('\n');

  const chatwoot = await createChatwootConversation({
    name,
    email,
    phone,
    message: summary,
    sessionId,
  });

  await updateAgentSession(sessionId, { status: 'handed_off' });

  const config = getAgentConfig();
  if (config.handoffPhone) {
    await sendWhatsAppText(
      config.handoffPhone,
      `Hot lead from Ratna (score ${session.lead_score}): ${name}${phone ? ` — ${phone}` : ''}`
    ).catch(() => null);
  }

  if (email) {
    await sendEnquiryEmails({
      id: sessionId,
      name,
      email,
      phone: phone ?? null,
      subject: 'Ratna AI handoff',
      message: summary,
      source: 'agent_handoff',
    }).catch(() => null);
  }

  await createInAppNotifications([
    {
      audience: 'admin',
      type: 'enquiry',
      title: `Ratna handoff — ${name}`,
      message: `Lead score ${session.lead_score}`,
      href: '/admin/agent-sessions',
      metadata: { session_id: sessionId, chatwoot: chatwoot.conversationId },
    },
  ]).catch(() => null);

  return { ok: true, chatwoot };
}

export async function maybeTriggerHandoff(sessionId: string) {
  const session = await getAgentSession(sessionId);
  if (!session || session.status !== 'active') return;

  const messages = await listSessionMessages(sessionId);
  const userCount = messages.filter((m) => m.role === 'user').length;
  const score = computeLeadScore({
    context: session.context,
    messageCount: userCount,
    channel: session.channel,
  });

  await updateAgentSession(sessionId, { lead_score: score });

  const threshold = getAgentConfig().leadScoreThreshold;
  if (score >= threshold || session.context.handoffRequested) {
    await triggerHotLeadHandoff(sessionId, 'Lead score threshold reached');
  }
}
