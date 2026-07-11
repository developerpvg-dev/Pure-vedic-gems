-- Ratna AI Agent tables (Option 1A)
-- Run after enabling: CREATE EXTENSION IF NOT EXISTS vector;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS agent_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id      TEXT NOT NULL,
    user_id         UUID REFERENCES auth.users(id),
    channel         TEXT NOT NULL DEFAULT 'chat'
                    CHECK (channel IN ('chat', 'voice', 'phone', 'whatsapp')),
    locale          TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'hi')),
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'closed', 'handed_off')),
    lead_score      INTEGER NOT NULL DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    context         JSONB NOT NULL DEFAULT '{}',
    enquiry_id      UUID REFERENCES enquiries(id),
    consent_at      TIMESTAMPTZ,
    whatsapp_phone  TEXT,
    external_ids    JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_visitor ON agent_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_created ON agent_sessions(created_at DESC);

CREATE TABLE IF NOT EXISTS agent_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content         TEXT NOT NULL DEFAULT '',
    language        TEXT CHECK (language IN ('en', 'hi')),
    tool_name       TEXT,
    tool_payload    JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_session ON agent_messages(session_id, created_at);

CREATE TABLE IF NOT EXISTS agent_knowledge (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    content         TEXT NOT NULL,
    language        TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi')),
    source          TEXT NOT NULL DEFAULT 'manual',
    metadata        JSONB NOT NULL DEFAULT '{}',
    embedding       vector(1536),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_knowledge_language ON agent_knowledge(language);
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_embedding ON agent_knowledge
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE IF NOT EXISTS agent_followups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    channel         TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'email')),
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
    payload         JSONB NOT NULL DEFAULT '{}',
    idempotency_key TEXT UNIQUE,
    error_message   TEXT,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_followups_session ON agent_followups(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_followups_status ON agent_followups(status) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS agent_webhook_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider        TEXT NOT NULL,
    external_id     TEXT NOT NULL,
    payload         JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, external_id)
);

-- Similarity search for RAG
CREATE OR REPLACE FUNCTION match_agent_knowledge(
    query_embedding vector(1536),
    match_count int DEFAULT 5,
    filter_language text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title text,
    content text,
    language text,
    source text,
    metadata jsonb,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        ak.id,
        ak.title,
        ak.content,
        ak.language,
        ak.source,
        ak.metadata,
        1 - (ak.embedding <=> query_embedding) AS similarity
    FROM agent_knowledge ak
    WHERE ak.embedding IS NOT NULL
      AND (filter_language IS NULL OR ak.language = filter_language)
    ORDER BY ak.embedding <=> query_embedding
    LIMIT GREATEST(match_count, 1);
$$;

ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages agent_sessions"
    ON agent_sessions FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manages agent_messages"
    ON agent_messages FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manages agent_knowledge"
    ON agent_knowledge FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manages agent_followups"
    ON agent_followups FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manages agent_webhook_events"
    ON agent_webhook_events FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admin reads agent_sessions"
    ON agent_sessions FOR SELECT
    USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "Admin reads agent_messages"
    ON agent_messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true));

CREATE TRIGGER agent_sessions_updated_at
    BEFORE UPDATE ON agent_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER agent_knowledge_updated_at
    BEFORE UPDATE ON agent_knowledge
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
