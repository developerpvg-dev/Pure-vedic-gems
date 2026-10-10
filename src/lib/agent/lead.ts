import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { getAgentConfig } from '@/lib/agent/config';
import { leadScoreLabel } from '@/lib/agent/lead-scorer';
import { getAgentSession, listSessionMessages, updateAgentSession } from '@/lib/agent/session';
import type { AgentMessageRow, AgentSessionRow } from '@/lib/agent/types';
import { logLeadActivity } from '@/lib/leads/assign';
import { duplicateNotifySuffix, findPriorDuplicateMatches } from '@/lib/leads/duplicates';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { sendEnquiryEmails } from '@/lib/resend/send-enquiry';
import { createAdminClient } from '@/lib/supabase/admin';

export type RatnaLeadTrigger = 'contact_shared' | 'hot_lead' | 'session_end';

const CHANNEL_LABEL: Record<AgentSessionRow['channel'], string> = {
  chat: 'Website chat',
  voice: 'Website voice',
  phone: 'Phone call',
  whatsapp: 'WhatsApp',
};
const CONVERSATION_MARK = '\n\n--- Conversation ---\n';
const IST_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });

const NOTE_PROMPT = `You write a short follow-up note in English for the Pure Vedic Gems sales team about a customer who talked to Ratna, the AI gem consultant. Use only facts from the conversation; write "not mentioned" when unknown. Use exactly these lines:
Wants:
Recommended: (gems and any products Ratna suggested, with links if shared)
Questions / concerns:
Suggested next step:
Best time to call:
Under 90 words. No greeting.`;

/** Hot → call today, warm → tomorrow, cold → in 3 days (IST calendar date, YYYY-MM-DD). */
export function followUpDateFor(score: number, now = new Date()) {
  const days = { hot: 0, warm: 1, cold: 3 }[leadScoreLabel(score)];
  return IST_DATE.format(new Date(now.getTime() + days * 86_400_000));
}

function formatBudget(min?: number, max?: number) {
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  if (min != null && max != null) return `${inr(min)}–${inr(max)}`;
  if (max != null) return `up to ${inr(max)}`;
  return min != null ? `${inr(min)}+` : null;
}

/** Shown to the team as the lead's message: facts, Ratna's note, then the full conversation. */
export function buildLeadMessage(
  session: Pick<AgentSessionRow, 'lead_score' | 'channel' | 'locale' | 'context'>,
  note: string,
  messages: Pick<AgentMessageRow, 'role' | 'content'>[]
) {
  const c = session.context;
  const birth = [c.birthDate, c.birthTime, c.birthPlace].filter(Boolean).join(', ');
  const budget = formatBudget(c.budgetMin, c.budgetMax);
  const header = [
    `Ratna note · Score ${session.lead_score} (${leadScoreLabel(session.lead_score)}) · ${CHANNEL_LABEL[session.channel]} · ${session.locale === 'hi' ? 'Hindi' : 'English'}`,
    c.purpose ? `Purpose: ${c.purpose}` : null,
    budget ? `Budget: ${budget}` : null,
    c.urgencySignals?.length ? `Urgency: ${c.urgencySignals.join(', ')}` : null,
    birth ? `Birth: ${birth}` : null,
  ]
    .filter(Boolean)
    .join('\n');
  // ponytail: keep the latest 12k chars of very long chats; the start is usually greetings
  const conversation = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `${m.role === 'user' ? 'Customer' : 'Ratna'}: ${m.content}`)
    .join('\n')
    .slice(-12_000);
  const summary = note.trim() || '(AI summary unavailable: read the conversation below.)';
  return `${header}\n\n${summary}${CONVERSATION_MARK}${conversation}`;
}

async function writeLeadNote(session: AgentSessionRow, messages: AgentMessageRow[]) {
  const config = getAgentConfig();
  if (!config.openaiKey || !messages.length) return '';
  const transcript = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `${m.role === 'user' ? 'Customer' : 'Ratna'}: ${m.content}`)
    .join('\n')
    .slice(-12_000);
  try {
    const { text } = await generateText({
      model: openai(config.model),
      maxOutputTokens: 350,
      system: NOTE_PROMPT,
      prompt: `Known details: ${JSON.stringify(session.context).slice(0, 2000)}\n\nConversation:\n${transcript}`,
    });
    return text;
  } catch (err) {
    // The lead is still saved with the full conversation; only the summary is missing.
    console.error('[ratna-lead-note]', err);
    return '';
  }
}

const clip = (v: string | undefined, max: number) => (v ? v.slice(0, max) : null);
const isoDate = (v: string | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

/**
 * Creates (or refreshes) the CRM lead for a Ratna session that has a phone or email.
 * Sessions without contact details are left as stored transcripts only.
 */
export async function upsertRatnaLead(sessionId: string, trigger: RatnaLeadTrigger) {
  const session = await getAgentSession(sessionId);
  if (!session) return { ok: false as const, reason: 'session_not_found' };

  const c = session.context;
  const phone = clip(c.phone ?? session.whatsapp_phone ?? undefined, 20);
  const email = clip(c.email, 255);
  if (!phone && !email) return { ok: false as const, reason: 'no_contact' };

  const messages = await listSessionMessages(sessionId, 80);
  const message = buildLeadMessage(session, await writeLeadNote(session, messages), messages);
  const followUp = followUpDateFor(session.lead_score);
  const hot = leadScoreLabel(session.lead_score) === 'hot';
  const name = clip(c.name, 200) || 'Ratna visitor';
  const source = `agent_${session.channel}`;
  const admin = createAdminClient();

  if (session.enquiry_id) {
    const { data: lead } = await admin
      .from('enquiries')
      .select('pipeline_stage')
      .eq('id', session.enquiry_id)
      .maybeSingle();
    // Once the team has started working the lead, only refresh the note; never overwrite their edits.
    const untouched = lead?.pipeline_stage === 'new';
    const { error } = await admin
      .from('enquiries')
      .update({
        message,
        ...(untouched ? { follow_up_date: followUp, name, ...(phone ? { phone } : {}), ...(email ? { email } : {}) } : {}),
      })
      .eq('id', session.enquiry_id);
    if (error) throw new Error(error.message);
    if (trigger === 'hot_lead') {
      await notifyTeam({ enquiryId: session.enquiry_id, sessionId, name, email, phone, message, source, hot, dupeNote: '' });
    }
    return { ok: true as const, enquiryId: session.enquiry_id };
  }

  const { data, error } = await admin
    .from('enquiries')
    .insert({
      name,
      email: email ?? '',
      phone,
      subject: 'Ratna AI consultation',
      message,
      product_id: c.recommendedProducts?.[0] ?? null,
      source,
      status: 'new',
      pipeline_stage: 'new',
      enquiry_type: 'Enquiry',
      date_of_birth: isoDate(c.birthDate),
      birth_time: clip(c.birthTime, 40),
      birth_place: clip(c.birthPlace, 180),
      area_of_concern: clip(c.purpose, 180),
      follow_up_date: followUp,
      is_draft: false,
    })
    .select('id, lead_number, created_at')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create Ratna lead');

  await updateAgentSession(sessionId, { enquiry_id: data.id });

  const matches = await findPriorDuplicateMatches(admin, {
    id: data.id,
    lead_number: data.lead_number,
    email: email ?? '',
    phone,
    date_of_birth: isoDate(c.birthDate),
    birth_time: clip(c.birthTime, 40),
    birth_place: clip(c.birthPlace, 180),
    created_at: data.created_at,
  });
  if (matches[0]) {
    await logLeadActivity(admin, {
      enquiryId: data.id,
      action: 'duplicate_detected',
      toValue: matches[0].status,
      meta: {
        prior_id: matches[0].id,
        prior_lead_number: matches[0].lead_number,
        matched_fields: matches[0].matched_fields,
        prior_telecaller: matches[0].telecaller_name,
      },
      actorName: 'system',
    });
  }

  await notifyTeam({
    enquiryId: data.id,
    sessionId,
    name,
    email,
    phone,
    message,
    source,
    hot,
    dupeNote: duplicateNotifySuffix(matches),
  });
  return { ok: true as const, enquiryId: data.id };
}

async function notifyTeam(input: {
  enquiryId: string;
  sessionId: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  source: string;
  hot: boolean;
  dupeNote: string;
}) {
  const title = input.hot ? 'Hot Ratna lead: call today' : 'New Ratna lead: assign telecaller';
  await Promise.allSettled([
    sendEnquiryEmails({
      id: input.enquiryId,
      name: input.name,
      email: input.email ?? '',
      phone: input.phone,
      subject: title,
      message: input.message.split(CONVERSATION_MARK)[0],
      source: input.source,
      notifyCustomer: false,
    }),
    createInAppNotifications([
      {
        audience: 'admin',
        recipientRole: 'sales',
        type: 'new_enquiry',
        title,
        message: input.dupeNote ? `${input.name} · ${input.dupeNote}` : `${input.name} talked to Ratna. Read the note and call back.`,
        href: `/admin/leads?type=enquiry&id=${input.enquiryId}`,
        entityType: 'enquiry',
        entityId: input.enquiryId,
        metadata: { source: input.source, session_id: input.sessionId },
      },
    ]),
  ]);
}

/** Session finished (widget closed, call ended, or idle): write the final lead note, then close. */
export async function closeRatnaSession(sessionId: string) {
  const session = await getAgentSession(sessionId);
  if (!session || session.status === 'closed') return { ok: false as const, reason: 'already_closed' };
  const result = await upsertRatnaLead(sessionId, 'session_end');
  await updateAgentSession(sessionId, { status: 'closed', closed_at: new Date().toISOString() });
  return result;
}
