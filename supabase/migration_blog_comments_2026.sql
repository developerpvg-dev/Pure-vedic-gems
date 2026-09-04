-- Blog comments from registered customers (moderated before public display).

BEGIN;

CREATE TABLE IF NOT EXISTS blog_comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_slug       VARCHAR(300) NOT NULL,
    customer_id     UUID REFERENCES auth.users(id) NOT NULL,
    author_name     VARCHAR(200) NOT NULL,
    body            TEXT NOT NULL CHECK (char_length(trim(body)) >= 3),
    is_approved     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_slug_approved
    ON blog_comments (blog_slug, is_approved, created_at);

CREATE INDEX IF NOT EXISTS idx_blog_comments_customer
    ON blog_comments (customer_id, created_at DESC);

ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads approved blog comments"
    ON blog_comments FOR SELECT
    USING (is_approved = true);

CREATE POLICY "Users insert own blog comments"
    ON blog_comments FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admin manages blog comments"
    ON blog_comments FOR ALL
    USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

COMMIT;
