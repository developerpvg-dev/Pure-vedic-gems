-- Week 18: Educational Video Library
-- Migrated from legacy WordPress "videos" post type (taxonomy: vidoss_cat).
-- Mirrors the events video system but is a standalone, admin-managed library
-- surfaced at the public /videos route. YouTube-hosted educational content.

-- ── Tables ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS video_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    description TEXT,
    legacy_term_id BIGINT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES video_categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug VARCHAR(300) NOT NULL UNIQUE,
    youtube_url TEXT NOT NULL,
    youtube_id VARCHAR(40) NOT NULL,
    description TEXT,
    legacy_url TEXT,
    legacy_wp_id BIGINT,
    seo_title VARCHAR(300),
    seo_description VARCHAR(400),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_video_categories_active ON video_categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category_id, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_videos_active ON videos(is_active, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_legacy_wp_id ON videos(legacy_wp_id) WHERE legacy_wp_id IS NOT NULL;

-- ── Row Level Security ───────────────────────────────────────────────

ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active video categories" ON video_categories;
CREATE POLICY "Public reads active video categories"
    ON video_categories FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin manages video categories" ON video_categories;
CREATE POLICY "Admin manages video categories"
    ON video_categories FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

DROP POLICY IF EXISTS "Public reads active videos" ON videos;
CREATE POLICY "Public reads active videos"
    ON videos FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin manages videos" ON videos;
CREATE POLICY "Admin manages videos"
    ON videos FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );
