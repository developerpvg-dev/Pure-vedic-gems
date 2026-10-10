import { getAgentConfig } from '@/lib/agent/config';
import { upsertRatnaLead } from '@/lib/agent/lead';
import { computeLeadScore } from '@/lib/agent/lead-scorer';
import { getAgentSession, listSessionMessages, updateAgentSession } from '@/lib/agent/session';

/** Hot lead: put it in the CRM now (with the team alert). Without contact details Ratna is told to ask for them. */
export async function triggerHotLeadHandoff(sessionId: string) {
  const lead = await upsertRatnaLead(sessionId, 'hot_lead');
  if (!lead.ok) return lead;
  // handed_off stops maybeTriggerHandoff re-alerting on every later turn
  await updateAgentSession(sessionId, { status: 'handed_off' });
  return lead;
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
    await triggerHotLeadHandoff(sessionId);
  }
}
