import { createAdminClient } from '@/lib/supabase/admin';
import { getAgentConfig } from '@/lib/agent/config';
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

export async function seedDefaultKnowledge() {
  const siteUrl = getAgentConfig().siteUrl;
  const seeds = [
    {
      title: 'What is a Vedic gemstone?',
      content: 'Vedic gemstones are worn based on Jyotish principles to strengthen planetary energies. PureVedicGems offers certified natural gems with lab reports.',
      language: 'en' as const,
      source: 'seed',
    },
    {
      title: 'वैदिक रत्न क्या है?',
      content: 'वैदिक रत्न ज्योतिष के अनुसार ग्रहों की ऊर्जा को मजबूत करने के लिए धारण किए जाते हैं। PureVedicGems प्रमाणित प्राकृतिक रत्न प्रदान करता है।',
      language: 'hi' as const,
      source: 'seed',
    },
    {
      title: 'How to choose gemstone by rashi',
      content: 'Solar rashi from date of birth gives a preliminary guide. For moon rashi and lagna, book a consultation with our astrologer.',
      language: 'en' as const,
      source: 'seed',
    },
    {
      title: 'Consultation booking',
      content: `Paid astrologer consultations are available at ${siteUrl}/consultation for detailed birth chart analysis.`,
      language: 'en' as const,
      source: 'seed',
    },
  ];

  for (const seed of seeds) {
    try {
      await ingestKnowledgeChunk(seed);
    } catch {
      // ponytail: skip duplicate seeds on re-run
    }
  }
}
