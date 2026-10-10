import { createAdminClient } from '@/lib/supabase/admin';
import { getAgentConfig } from '@/lib/agent/config';
import { RATNA_FAQS } from '@/lib/agent/ratna-faqs';
import type { AgentKnowledgeRow, AgentLocale } from '@/lib/agent/types';

async function embedText(text: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ embedding: number[] }> };
  return json.data?.[0]?.embedding ?? null;
}

export async function searchAgentKnowledge(query: string, locale?: AgentLocale, limit = 5) {
  const embedding = await embedText(query);
  if (!embedding) return keywordSearchKnowledge(query, locale, limit);

  const admin = createAdminClient() as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: AgentKnowledgeRow[] | null; error: { message: string } | null }>;
  };

  const { data, error } = await admin.rpc('match_agent_knowledge', {
    query_embedding: embedding,
    match_count: limit,
    filter_language: locale ?? null,
  });

  if (error || !data?.length) return keywordSearchKnowledge(query, locale, limit);
  return data;
}

async function keywordSearchKnowledge(query: string, locale?: AgentLocale, limit = 5) {
  const admin = createAdminClient() as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        or: (f: string) => {
          limit: (n: number) => Promise<{ data: AgentKnowledgeRow[] | null; error: { message: string } | null }>;
        };
        eq: (col: string, val: string) => {
          or: (f: string) => {
            limit: (n: number) => Promise<{ data: AgentKnowledgeRow[] | null; error: { message: string } | null }>;
          };
        };
      };
    };
  };

  const term = query.replace(/[%]/g, '').trim();
  if (!term) return [];

  const filter = `title.ilike.%${term}%,content.ilike.%${term}%`;
  const q = locale
    ? admin.from('agent_knowledge').select('id, title, content, language, source, metadata').eq('language', locale).or(filter).limit(limit)
    : admin.from('agent_knowledge').select('id, title, content, language, source, metadata').or(filter).limit(limit);

  const { data } = await q;
  return data ?? [];
}

export async function ingestKnowledgeChunk(input: {
  title: string;
  content: string;
  language: AgentLocale;
  source: string;
  metadata?: Record<string, unknown>;
}) {
  const embedding = await embedText(`${input.title}\n\n${input.content}`);
  const admin = createAdminClient() as unknown as {
    from: (t: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
  };

  const { error } = await admin.from('agent_knowledge').insert({
    title: input.title,
    content: input.content,
    language: input.language,
    source: input.source,
    metadata: input.metadata ?? {},
    embedding,
  });

  if (error) throw new Error(error.message);
}

/** Replaces all seeded rows (source 'seed' / 'faq') with the client FAQs, so re-running is safe. */
export async function seedDefaultKnowledge() {
  const siteUrl = getAgentConfig().siteUrl;
  const seeds = [
    ...RATNA_FAQS.flatMap((f) => [
      { title: f.q, content: f.en, language: 'en' as const, source: 'faq' },
      { title: f.q, content: f.hi, language: 'hi' as const, source: 'faq' },
    ]),
    {
      title: 'Consultation booking',
      content: `Paid astrologer consultations are available at ${siteUrl}/consultation for detailed birth chart analysis.`,
      language: 'en' as const,
      source: 'seed',
    },
  ];

  const admin = createAdminClient() as unknown as {
    from: (t: string) => {
      delete: () => { in: (col: string, vals: string[]) => Promise<{ error: { message: string } | null }> };
    };
  };
  const { error } = await admin.from('agent_knowledge').delete().in('source', ['seed', 'faq']);
  if (error) throw new Error(error.message);

  // ponytail: 8 embeddings at a time keeps an 81-row seed to a few seconds without tripping OpenAI rate limits
  for (let i = 0; i < seeds.length; i += 8) {
    await Promise.all(seeds.slice(i, i + 8).map((seed) => ingestKnowledgeChunk(seed)));
  }
  return { count: seeds.length };
}
