import { createAdminClient } from '@/lib/supabase/admin';
import type {
  AgentChannel,
  AgentLocale,
  AgentMessageRow,
  AgentSessionContext,
  AgentSessionRow,
} from '@/lib/agent/types';

// ponytail: typed as loose records until database.ts is regenerated from Supabase
type AgentDb = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => {
      select: (cols?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> };
    };
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => { select: (cols?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };
    };
    select: (cols?: string) => {
      eq: (col: string, val: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
        order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
      };
    };
  };
};

function db() {
  return createAdminClient() as unknown as AgentDb;
}

function mapSession(row: Record<string, unknown>): AgentSessionRow {
  return row as unknown as AgentSessionRow;
}

function mapMessage(row: Record<string, unknown>): AgentMessageRow {
  return row as unknown as AgentMessageRow;
}

export async function createAgentSession(input: {
  visitorId: string;
  channel?: AgentChannel;
  locale?: AgentLocale;
  whatsappPhone?: string;
}) {
  const { data, error } = await db()
    .from('agent_sessions')
    .insert({
      visitor_id: input.visitorId,
      channel: input.channel ?? 'chat',
      locale: input.locale ?? 'en',
      whatsapp_phone: input.whatsappPhone ?? null,
      context: {},
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Failed to create session');
  return mapSession(data);
}

export async function getAgentSession(sessionId: string) {
  const { data, error } = await db().from('agent_sessions').select('*').eq('id', sessionId).single();
  if (error || !data) return null;
  return mapSession(data);
}

export async function updateAgentSession(
  sessionId: string,
  patch: Partial<{
    locale: AgentLocale;
    status: AgentSessionRow['status'];
    lead_score: number;
    context: AgentSessionContext;
    enquiry_id: string;
    consent_at: string;
    closed_at: string;
  }>
) {
  const { data, error } = await db()
    .from('agent_sessions')
    .update(patch as Record<string, unknown>)
    .eq('id', sessionId)
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Failed to update session');
  return mapSession(data);
}

export async function listSessionMessages(sessionId: string, limit = 40) {
  const { data, error } = await db()
    .from('agent_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  const rows = (data ?? []).slice(-limit);
  return rows.map(mapMessage);
}

export async function insertAgentMessage(input: {
  sessionId: string;
  role: AgentMessageRow['role'];
  content: string;
  language?: AgentLocale;
  toolName?: string;
  toolPayload?: Record<string, unknown>;
}) {
  const { data, error } = await db()
    .from('agent_messages')
    .insert({
      session_id: input.sessionId,
      role: input.role,
      content: input.content,
      language: input.language ?? null,
      tool_name: input.toolName ?? null,
      tool_payload: input.toolPayload ?? null,
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Failed to insert message');
  return mapMessage(data);
}

export async function mergeSessionContext(sessionId: string, context: AgentSessionContext) {
  const session = await getAgentSession(sessionId);
  if (!session) throw new Error('Session not found');
  const merged = { ...session.context, ...context };
  return updateAgentSession(sessionId, { context: merged });
}

export async function listAgentSessionsForAdmin(limit = 50) {
  const admin = createAdminClient() as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        order: (col: string, opts: { ascending: boolean }) => {
          limit: (n: number) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
        };
      };
    };
  };

  const { data, error } = await admin
    .from('agent_sessions')
    .select('id, visitor_id, channel, locale, status, lead_score, enquiry_id, created_at, closed_at, context')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSession);
}
