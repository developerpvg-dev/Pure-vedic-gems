-- ============================================================================
-- Week 16: Admin-managed events, lab certificates, and feedback pages
-- Run after schema.sql and storage setup. Idempotent and safe to rerun.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS event_video_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(180) NOT NULL,
    slug        VARCHAR(220) UNIQUE NOT NULL,
    description TEXT,
    sort_order  INTEGER DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_videos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID NOT NULL REFERENCES event_video_categories(id) ON DELETE CASCADE,
    title           VARCHAR(220) NOT NULL,
    slug            VARCHAR(260) UNIQUE NOT NULL,
    youtube_url     TEXT NOT NULL,
    youtube_id      VARCHAR(40) NOT NULL,
    legacy_url      TEXT,
    description     TEXT,
    sort_order      INTEGER DEFAULT 0,
    is_featured     BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_certificates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(220) NOT NULL,
    slug            VARCHAR(260) UNIQUE NOT NULL,
    lab_name        VARCHAR(220),
    certificate_url TEXT NOT NULL,
    thumbnail_url   TEXT,
    description     TEXT,
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(180) NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(40),
    location        VARCHAR(140),
    rating          INTEGER CHECK (rating BETWEEN 1 AND 5) DEFAULT 5,
    subject         VARCHAR(220),
    message         TEXT NOT NULL,
    allow_display   BOOLEAN DEFAULT FALSE,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_featured     BOOLEAN DEFAULT FALSE,
    admin_notes     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_video_categories_active ON event_video_categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_event_videos_category ON event_videos(category_id, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_lab_certificates_active ON lab_certificates(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_feedback_public ON feedback_submissions(status, allow_display, is_featured, created_at DESC);

ALTER TABLE event_video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active event categories" ON event_video_categories;
CREATE POLICY "Public reads active event categories"
    ON event_video_categories FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin manages event categories" ON event_video_categories;
CREATE POLICY "Admin manages event categories"
    ON event_video_categories FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

DROP POLICY IF EXISTS "Public reads active event videos" ON event_videos;
CREATE POLICY "Public reads active event videos"
    ON event_videos FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin manages event videos" ON event_videos;
CREATE POLICY "Admin manages event videos"
    ON event_videos FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

DROP POLICY IF EXISTS "Public reads active lab certificates" ON lab_certificates;
CREATE POLICY "Public reads active lab certificates"
    ON lab_certificates FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin manages lab certificates" ON lab_certificates;
CREATE POLICY "Admin manages lab certificates"
    ON lab_certificates FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

DROP POLICY IF EXISTS "Public reads approved feedback" ON feedback_submissions;
CREATE POLICY "Public reads approved feedback"
    ON feedback_submissions FOR SELECT USING (status = 'approved' AND allow_display = true);

DROP POLICY IF EXISTS "Anyone submits feedback" ON feedback_submissions;
CREATE POLICY "Anyone submits feedback"
    ON feedback_submissions FOR INSERT WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Admin manages feedback" ON feedback_submissions;
CREATE POLICY "Admin manages feedback"
    ON feedback_submissions FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

INSERT INTO event_video_categories (title, slug, sort_order)
VALUES
('Chaitra Navratre Yagya-2022', 'chaitra-navratre-yagya-2022', 10),
('Chaitra Navratre Yagya-2024', 'chaitra-navratre-yagya-2024', 20),
('Chaitra Navratre Yagya-2025', 'chaitra-navratre-yagya-2025', 30),
('Durga Sapshati Path-2023', 'durga-sapshati-path-2023', 40),
('Durga Saptashati Yagya - Navratre Celebrations 2019', 'durga-saptashati-yagya-navratre-celebrations-2019', 50),
('Ganapati Special Pooja-2023', 'ganapati-special-pooja-2023', 60),
('GURU CHANDAL DOSH SHANTI YAGYA AND PATH', 'guru-chandal-dosh-shanti-yagya-and-path', 70),
('Interview with Wellness 360', 'interview-with-wellness-360', 80),
('LAKSHMI GANPATI DIWALI POOJA 2020', 'lakshmi-ganpati-diwali-pooja-2020', 90),
('Lakshmi Ganpati Puja-2019', 'lakshmi-ganpati-puja-2019', 100),
('Maa Pratyangira Devi Yagya', 'maa-pratyangira-devi-yagya', 110),
('Mahashivratri Rudrabhishek 2025', 'mahashivratri-rudrabhishek-2025', 120),
('Navchandi Path And Yagya 2020', 'navchandi-path-and-yagya-2020', 130),
('Rudrabhishek Pooja 2021', 'rudra-abhishek-pooja-2021', 140),
('Rudrabhishek Pooja 2021', 'rudrabhishek-pooja-2021', 150),
('Rudrabhishek Pooja-2021', 'rudrabhishek-pooja-2021-1', 160),
('Rudrabhishek Pooja-2022', 'rudrabhishek-pooja-2022', 170),
('Rudrabhishek Pooja-2024', 'rudrabhishek-pooja-2024', 180),
('Shardiya Navratre Yagya-2021', 'shardiya-navratre-yagya-2021', 190),
('Shardiya Navratre Yagya-2022', 'shardiya-navratre-yagya-2022', 200),
('Shardiya Navratre Yagya-2023', 'shardiya-navratre-yagya-2023', 210),
('Shardiya Navratre Yagya-2024', 'shardiya-navratre-yagya-2024', 220),
('Vasant Utsav Saraswati Pooja Abhishek-2021', 'vasant-utsav-saraswati-pooja-abhishek-2021', 230)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order;

WITH seed(category_slug, title, video_slug, youtube_id, legacy_url, sort_order) AS (
VALUES
('chaitra-navratre-yagya-2022','Chaitra Navratre Yagya','chaitra-navratre-yagya','or9z45xXDXc','https://www.purevedicgems.com/events/chaitra-navratre-yagya/',10),
('chaitra-navratre-yagya-2022','Devi Shailputri Path','devi-shailputri-path-2022','bqleKGSZUT8','https://www.purevedicgems.com/events/chaitra-navratre-yagya-2/',20),
('chaitra-navratre-yagya-2022','Devi Chandraghanta Path','devi-chandraghanta-path-2022','4Q7WYhism7c','https://www.purevedicgems.com/events/chaitra-navratre-yagya-3/',30),
('chaitra-navratre-yagya-2022','Maa Skandamata Path','maa-skandamata-path-2022','5HEuoxt8jno','https://www.purevedicgems.com/events/chaitra-navratre-yagya-4/',40),
('chaitra-navratre-yagya-2022','Maa Katyayani Path','maa-katyayani-path-2022','b2Hqee2hFzQ','https://www.purevedicgems.com/events/chaitra-navratre-yagya-5/',50),
('chaitra-navratre-yagya-2022','Maa Mahagauri Path','maa-mahagauri-path-2022','1s95mUxwmJg','https://www.purevedicgems.com/events/chaitra-navratre-yagya-6/',60),
('chaitra-navratre-yagya-2022','Maa Siddhidatri Path','maa-siddhidatri-path-2022','Zq_sCqqwZdI','https://www.purevedicgems.com/events/chaitra-navratre-yagya-7/',70),
('chaitra-navratre-yagya-2024','Saptashati path and Yagya','saptashati-path-yagya-2024-1','ytGedKmdnYU','https://www.purevedicgems.com/events/saptashati-path-and-yagya-3/',10),
('chaitra-navratre-yagya-2024','Saptashati path and Yagya','saptashati-path-yagya-2024-2','2UGk_d4L7ec','https://www.purevedicgems.com/events/saptashati-path-and-yagya-4/',20),
('chaitra-navratre-yagya-2024','Saptashati path and Yagya','saptashati-path-yagya-2024-3','UJXb3FY8z2s','https://www.purevedicgems.com/events/saptashati-path-and-yagya-5/',30),
('chaitra-navratre-yagya-2025','Maa Shailputri Path','maa-shailputri-path-2025','Bt1ndl_UoUY','https://www.purevedicgems.com/events/maa-shailputri-path-2/',10),
('chaitra-navratre-yagya-2025','Maa Brahmacharni Path','maa-brahmacharni-path-2025','zOPnjjwr7r0','https://www.purevedicgems.com/events/maa-brahmacharni-path-2/',20),
('chaitra-navratre-yagya-2025','Maa Chandraghanta Path','maa-chandraghanta-path-2025','ERcl_l40nx4','https://www.purevedicgems.com/events/maa-chandraghanta-path-2/',30),
('chaitra-navratre-yagya-2025','Maa Kushmanda Path','maa-kushmanda-path-2025','1IvffPKF16U','https://www.purevedicgems.com/events/maa-kushmanda-path-2/',40),
('chaitra-navratre-yagya-2025','Maa Skandamata Path','maa-skandamata-path-2025','bCLrunMuv6g','https://www.purevedicgems.com/events/maa-skandamata-path-2/',50),
('chaitra-navratre-yagya-2025','Maa katyayani and Maa Kalratri Path','maa-katyayani-kalratri-path-2025','xZzJiq7r_d4','https://www.purevedicgems.com/events/maa-katyayani-and-maa-kalratri-path/',60),
('chaitra-navratre-yagya-2025','Maa Mahagauri Path','maa-mahagauri-path-2025','G1tRY_jLl88','https://www.purevedicgems.com/events/maa-mahagauri-path-2/',70),
('chaitra-navratre-yagya-2025','Maa Siddhidatri Path','maa-siddhidatri-path-2025','RtjkNiqipTI','https://www.purevedicgems.com/events/maa-siddhidatri-path/',80),
('chaitra-navratre-yagya-2025','Saptashati path and Yagya','saptashati-path-yagya-2025-1','ryNPxGMMdfk','https://www.purevedicgems.com/events/saptashati-path-and-yagya-8/',90),
('chaitra-navratre-yagya-2025','Saptashati path and Yagya','saptashati-path-yagya-2025-2','byt36COT-_0','https://www.purevedicgems.com/events/saptashati-path-and-yagya-9/',100),
('durga-sapshati-path-2023','Durga Sapshati Path','durga-sapshati-path','veGfGwvPcUA','https://www.purevedicgems.com/events/durga-sapshati-path/',10),
('durga-sapshati-path-2023','Durga Sapshati Yagya','durga-sapshati-yagya','6Wqw_YtCPKA','https://www.purevedicgems.com/events/durga-sapshati-yagya/',20),
('durga-saptashati-yagya-navratre-celebrations-2019','Durga Saptashati Yagya - Navratre Celebrations 2019','durga-saptashati-yagya-2019-1','-jkJD7pNxaM','https://www.purevedicgems.com/events/durga-saptashati-yagya-navratre-celebrations-2019/',10),
('durga-saptashati-yagya-navratre-celebrations-2019','Durga Saptashati Yagya - Navratre Celebrations 2019','durga-saptashati-yagya-2019-2','Gz5k8fFDG_Y','https://www.purevedicgems.com/events/durga-saptashati-yagya-navratre-celebrations-2019-2/',20),
('durga-saptashati-yagya-navratre-celebrations-2019','Durga Saptashati Yagya - Navratre Celebrations 2019','durga-saptashati-yagya-2019-3','aTgOScem8nc','https://www.purevedicgems.com/events/durga-saptashati-yagya-navratre-celebrations-2019-3/',30),
('durga-saptashati-yagya-navratre-celebrations-2019','Durga Saptashati Yagya - Navratre Celebrations 2019','durga-saptashati-yagya-2019-4','SKFJzTsAlG4','https://www.purevedicgems.com/events/durga-saptashati-yagya-navratre-celebrations-2019-4/',40),
('durga-saptashati-yagya-navratre-celebrations-2019','Durga Saptashati Yagya - Navratre Celebrations 2019','durga-saptashati-yagya-2019-5','FHyFPaTEuSw','https://www.purevedicgems.com/events/durga-saptashati-yagya-navratre-celebrations-2019-5/',50),
('ganapati-special-pooja-2023','Ganapati Special Pooja','ganapati-special-pooja','rb-YBkjpaA8','https://www.purevedicgems.com/events/ganapati-special-pooja/',10),
('ganapati-special-pooja-2023','Ganapati Special Pooja','ganapati-special-pooja-2','7o-2lCJyzrw','https://www.purevedicgems.com/events/ganapati-special-pooja-2/',20),
('guru-chandal-dosh-shanti-yagya-and-path','GURU CHANDAL DOSH SHANTI YAGYA AND PATH','guru-chandal-dosh-shanti-yagya-path-1','6n32sCz3K2M','https://www.purevedicgems.com/events/guru-chandal-dosh-shanti-yagya-and-path/',10),
('guru-chandal-dosh-shanti-yagya-and-path','GURU CHANDAL DOSH SHANTI YAGYA AND PATH','guru-chandal-dosh-shanti-yagya-path-2','qE6rgbURbk8','https://www.purevedicgems.com/events/guru-chandal-dosh-shanti-yagya-and-path-2/',20),
('guru-chandal-dosh-shanti-yagya-and-path','GURU CHANDAL DOSH SHANTI YAGYA AND PATH','guru-chandal-dosh-shanti-yagya-path-3','76Mq55OS0n8','https://www.purevedicgems.com/events/guru-chandal-dosh-shanti-yagya-and-path-3/',30),
('guru-chandal-dosh-shanti-yagya-and-path','GURU CHANDAL DOSH SHANTI YAGYA AND PATH','guru-chandal-dosh-shanti-yagya-path-4','R9ZXqWNqz2Y','https://www.purevedicgems.com/events/guru-chandal-dosh-shanti-yagya-and-path-4/',40),
('interview-with-wellness-360','Interview with Dr Minoo Sachdev Of Wellness 360','interview-dr-minoo-sachdev-wellness-360','0FwSiSAG9Fc','https://www.purevedicgems.com/events/interview-with-dr-minoo-sachdev-of-wellness-360/',10),
('lakshmi-ganpati-diwali-pooja-2020','LAKSHMI GANPATI DIWALI POOJA 2020','lakshmi-ganpati-diwali-pooja-2020','cIFAZBoDm8U','https://www.purevedicgems.com/events/lakshmi-ganpati-diwali-pooja-2020/',10),
('lakshmi-ganpati-puja-2019','Lakshmi Ganpati Puja','lakshmi-ganpati-puja','RspVvIDJUw0','https://www.purevedicgems.com/events/lakshmi-ganpati-puja/',10),
('maa-pratyangira-devi-yagya','Maa Pratyangira Devi Yagya','maa-pratyangira-devi-yagya-1','1r8qAEdIYbU','https://www.purevedicgems.com/events/maa-pratyangira-devi-yagya/',10),
('maa-pratyangira-devi-yagya','Maa Pratyangira Devi Yagya','maa-pratyangira-devi-yagya-2','Iovx_EE6tw8','https://www.purevedicgems.com/events/maa-pratyangira-devi-yagya-2/',20),
('maa-pratyangira-devi-yagya','Maa Pratyangira Devi Yagya-Stuti','maa-pratyangira-devi-yagya-stuti','hwIMHPaCv14','https://www.purevedicgems.com/events/maa-pratyangira-devi-yagya-stuti/',30),
('mahashivratri-rudrabhishek-2025','Mahashivratri 2025','mahashivratri-2025','C1u2gYTU354','https://www.purevedicgems.com/events/mahashivratri-2025/',10),
('navchandi-path-and-yagya-2020','Navchandi Path And Yagya','navchandi-path-and-yagya-2020-1','bh4i_rjpj_8','https://www.purevedicgems.com/events/navchandi-path-and-yagya/',10),
('navchandi-path-and-yagya-2020','Navchandi Path And Yagya','navchandi-path-and-yagya-2020-2','GTadrub26OU','https://www.purevedicgems.com/events/navchandi-path-and-yagya-2/',20),
('navchandi-path-and-yagya-2020','Navchandi Path And Yagya','navchandi-path-and-yagya-2020-3','caqqGw1k8KE','https://www.purevedicgems.com/events/navchandi-path-and-yagya-3/',30),
('rudra-abhishek-pooja-2021','Rudrabhishek Pooja-2021','rudrabhishek-pooja-2021-live','OUpaWYBj3XU','https://www.purevedicgems.com/events/rudrabhishek-pooja-2021/',10),
('rudra-abhishek-pooja-2021','Rudrabhishek Pooja-2021','rudrabhishek-pooja-2021-live-2','cc9upF6i4gw','https://www.purevedicgems.com/events/rudrabhishek-pooja-2021-4/',20),
('rudrabhishek-pooja-2021','Rudrabhishek Pooja-2021','maha-shivratri-rudrabhishek-2021','t_tW7GtIjXs','https://www.purevedicgems.com/events/rudrabhishek-pooja-2021-2/',10),
('rudrabhishek-pooja-2021','Rudrabhishek Pooja-2021','rudrabhishek-pooja-2021-3','TEgT2Blyg0I','https://www.purevedicgems.com/events/rudrabhishek-pooja-2021-3/',20),
('rudrabhishek-pooja-2021','Rudrabhishek Pooja-2021','shubh-mahashivratri-rudrabhishek-2021','74-GrLFjUhU','https://www.purevedicgems.com/events/rudrabhishek-pooja-2021-5/',30),
('rudrabhishek-pooja-2021-1','Rudrabhishek Pooja','rudrabhishek-pooja','4XuGjmNl9xY','https://www.purevedicgems.com/events/rudrabhishek-pooja/',10),
('rudrabhishek-pooja-2022','Rudrabhishek Pooja-2022','rudrabhishek-pooja-2022','vAG-s8p9SwA','https://www.purevedicgems.com/events/rudrabhishek-pooja-2022/',10),
('rudrabhishek-pooja-2024','Rudrabhishek Pooja-2024','rudrabhishek-pooja-2024','ImZKh1qgjSg','https://www.purevedicgems.com/events/rudrabhishek-pooja-2024/',10),
('shardiya-navratre-yagya-2021','Shardiya Navratre Yagya','shardiya-navratre-yagya-2021-1','PZnQ_DR7d9s','https://www.purevedicgems.com/events/shardiya-navratre-yagya/',10),
('shardiya-navratre-yagya-2021','Shardiya Navratre Yagya','shardiya-navratre-yagya-2021-2','PhViSPYqM4I','https://www.purevedicgems.com/events/shardiya-navratre-yagya-2/',20),
('shardiya-navratre-yagya-2022','Maa Shailputri Path','maa-shailputri-path-2022-shardiya-1','-bYwsn_Xe8k','https://www.purevedicgems.com/events/navchandi-path-and-yagya-4/',10),
('shardiya-navratre-yagya-2022','Maa Shailputri Path','maa-shailputri-path-2022-shardiya-2','J_6j-PkffVw','https://www.purevedicgems.com/events/navchandi-path-and-yagya-5/',20),
('shardiya-navratre-yagya-2022','Maa Brahmacharni Path','maa-brahmacharni-path-2022','-huZ_VdDySc','https://www.purevedicgems.com/events/navchandi-path-and-yagya-6/',30),
('shardiya-navratre-yagya-2022','Maa Chandraghanta Path','maa-chandraghanta-path-2022','q0RaB6C4MGM','https://www.purevedicgems.com/events/navchandi-path-and-yagya-7/',40),
('shardiya-navratre-yagya-2022','Maa Kushmanda Path','maa-kushmanda-path-2022','nqyiKbOG600','https://www.purevedicgems.com/events/navchandi-path-and-yagya-8/',50),
('shardiya-navratre-yagya-2022','Maa Skanda Mata Path','maa-skanda-mata-path-2022','3XOQlG0BXRM','https://www.purevedicgems.com/events/navchandi-path-and-yagya-9/',60),
('shardiya-navratre-yagya-2022','Maa Katyayani Path','maa-katyayani-path-2022-shardiya','mW85N9y1Oq4','https://www.purevedicgems.com/events/navchandi-path-and-yagya-10/',70),
('shardiya-navratre-yagya-2022','Maa Kalaratri Path','maa-kalaratri-path-2022','p5IwPQhVKzI','https://www.purevedicgems.com/events/navchandi-path-and-yagya-11/',80),
('shardiya-navratre-yagya-2022','Maa Mahagauri Path','maa-mahagauri-path-2022-shardiya','AqirT4vbr6k','https://www.purevedicgems.com/events/navchandi-path-and-yagya-12/',90),
('shardiya-navratre-yagya-2022','Maa Siddhidatri Path','maa-siddhidatri-path-2022-shardiya','63npjrA2lAA','https://www.purevedicgems.com/events/navchandi-path-and-yagya-13/',100),
('shardiya-navratre-yagya-2022','Navchandi Path And Yagya','navchandi-path-and-yagya-2022','14_TCXhNItw','https://www.purevedicgems.com/events/navchandi-path-and-yagya-14/',110),
('shardiya-navratre-yagya-2022','Aarti','aarti-shardiya-2022','8WZiv6x-1Ug','https://www.purevedicgems.com/events/navchandi-path-and-yagya-15/',120),
('shardiya-navratre-yagya-2023','Saptashati path and Yagya','saptashati-path-yagya-2023-1','Zq4IRCXr1G8','https://www.purevedicgems.com/events/saptashati-path-and-yagya/',10),
('shardiya-navratre-yagya-2023','Saptashati path and Yagya','saptashati-path-yagya-2023-2','krFbRzoLTmE','https://www.purevedicgems.com/events/saptashati-path-and-yagya-2/',20),
('shardiya-navratre-yagya-2024','Saptashati path and Yagya','saptashati-path-yagya-2024-shardiya-1','ytGedKmdnYU','https://www.purevedicgems.com/events/saptashati-path-and-yagya-6/',10),
('shardiya-navratre-yagya-2024','Saptashati path and Yagya','saptashati-path-yagya-2024-shardiya-2','2UGk_d4L7ec','https://www.purevedicgems.com/events/saptashati-path-and-yagya-7/',20),
('shardiya-navratre-yagya-2024','Aarti','aarti-shardiya-2024','UJXb3FY8z2s','https://www.purevedicgems.com/events/aarti/',30),
('shardiya-navratre-yagya-2024','Kalash Sthapna Pooja','kalash-sthapna-pooja-2024','3ARs9X3asxk','https://www.purevedicgems.com/events/kalash-sthapna-pooja/',40),
('shardiya-navratre-yagya-2024','Maa Shailputri Path','maa-shailputri-path-2024','qCaPS539-mo','https://www.purevedicgems.com/events/maa-shailputri-path/',50),
('shardiya-navratre-yagya-2024','Maa Brahmacharni Path','maa-brahmacharni-path-2024','sYEZ5nniUFQ','https://www.purevedicgems.com/events/maa-brahmacharni-path/',60),
('shardiya-navratre-yagya-2024','Maa Chandraghanta Path','maa-chandraghanta-path-2024','rdPAS1wSyyc','https://www.purevedicgems.com/events/maa-chandraghanta-path/',70),
('shardiya-navratre-yagya-2024','Maa Kushmanda Path','maa-kushmanda-path-2024','zi1uIDMPIp0','https://www.purevedicgems.com/events/maa-kushmanda-path/',80),
('shardiya-navratre-yagya-2024','Maa Skandamata Path','maa-skandamata-path-2024','nM17dDT5cKw','https://www.purevedicgems.com/events/maa-skandamata-path/',90),
('shardiya-navratre-yagya-2024','Maa Katyayani Path','maa-katyayani-path-2024','qO993lTYWRc','https://www.purevedicgems.com/events/maa-katyayani-path/',100),
('shardiya-navratre-yagya-2024','Maa Kalratri Path','maa-kalratri-path-2024','J0UhGP4I2Kw','https://www.purevedicgems.com/events/maa-kalratri-path/',110),
('shardiya-navratre-yagya-2024','Maa Mahagauri Path','maa-mahagauri-path-2024','Ro73L5GZ01A','https://www.purevedicgems.com/events/maa-mahagauri-path/',120),
('vasant-utsav-saraswati-pooja-abhishek-2021','Vasant Utsav Saraswati Pooja Abhishek','vasant-utsav-saraswati-pooja-abhishek-1','PXF7NJ9vC5o','https://www.purevedicgems.com/events/vasant-utsav-saraswati-pooja-abhishek/',10),
('vasant-utsav-saraswati-pooja-abhishek-2021','Vasant Utsav Saraswati Pooja Abhishek','vasant-utsav-saraswati-pooja-abhishek-2','kwl944qL0Q4','https://www.purevedicgems.com/events/vasant-utsav-saraswati-pooja-abhishek-2/',20),
('vasant-utsav-saraswati-pooja-abhishek-2021','Vasant Utsav Saraswati Pooja Abhishek','vasant-utsav-saraswati-pooja-abhishek-3','fI24V0Qi-mQ','https://www.purevedicgems.com/events/vasant-utsav-saraswati-pooja-abhishek-3/',30)
)
INSERT INTO event_videos (category_id, title, slug, youtube_url, youtube_id, legacy_url, sort_order)
SELECT c.id, seed.title, seed.video_slug, 'https://www.youtube.com/watch?v=' || seed.youtube_id, seed.youtube_id, seed.legacy_url, seed.sort_order
FROM seed
JOIN event_video_categories c ON c.slug = seed.category_slug
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    youtube_url = EXCLUDED.youtube_url,
    youtube_id = EXCLUDED.youtube_id,
    legacy_url = EXCLUDED.legacy_url,
    sort_order = EXCLUDED.sort_order;

INSERT INTO lab_certificates (name, slug, lab_name, certificate_url, thumbnail_url, sort_order)
VALUES
('GRS - International (Swiss Lab)', 'grs-international-swiss-lab', 'GRS', '/legacy/lab-certificates/grs-international-swiss-lab.jpg', '/legacy/lab-certificates/grs-international-swiss-lab.jpg', 10),
('GII-(Govt. Lab By GJEPC)-Mumbai', 'gii-govt-lab-gjepc-mumbai', 'GII Mumbai', '/legacy/lab-certificates/gii-govt-lab-gjepc-mumbai.jpg', '/legacy/lab-certificates/gii-govt-lab-gjepc-mumbai.jpg', 20),
('IIGJ (Govt. Lab by GJEPC)- DELHI', 'iigj-govt-lab-gjepc-delhi', 'IIGJ Delhi', '/legacy/lab-certificates/iigj-govt-lab-gjepc-delhi.jpg', '/legacy/lab-certificates/iigj-govt-lab-gjepc-delhi.jpg', 30),
('Rudraksha Certificate', 'rudraksha-certificate', 'Rudraksha Certification', '/legacy/lab-certificates/rudraksha-certificate.jpg', '/legacy/lab-certificates/rudraksha-certificate.jpg', 40),
('IIGJ (Govt. Lab by GJEPC)- Jaipur', 'iigj-govt-lab-gjepc-jaipur', 'IIGJ Jaipur', '/legacy/lab-certificates/iigj-govt-lab-gjepc-jaipur.jpg', '/legacy/lab-certificates/iigj-govt-lab-gjepc-jaipur.jpg', 50),
('IGI - (INTERNATIONAL GEMOLOGICAL INSTITUTE INDIA)- Jaipur/Mumbai', 'igi-international-gemological-institute-india-jaipur-mumbai', 'IGI India', '/legacy/lab-certificates/igi-india-jaipur-mumbai.jpg', '/legacy/lab-certificates/igi-india-jaipur-mumbai.jpg', 60),
('IGI - (INTERNATIONAL GEMOLOGICAL INSTITUTE INDIA)- Jaipur/Mumbai', 'igi-international-gemological-institute-india-jaipur-mumbai-2', 'IGI India', '/legacy/lab-certificates/igi-india-jaipur-mumbai-2.jpg', '/legacy/lab-certificates/igi-india-jaipur-mumbai-2.jpg', 70),
('IIGJ (Govt. Lab by GJEPC)- Delhi', 'igi-gtl-certificate-delhi', 'IIGJ Delhi', '/legacy/lab-certificates/igi-gtl-certificate-delhi.jpg', '/legacy/lab-certificates/igi-gtl-certificate-delhi.jpg', 80),
('GIA (GEMOLOGICAL INSTITUTE OF AMERICA)', 'gia-gemological-institute-of-america', 'GIA', '/legacy/lab-certificates/gia-gemological-institute-of-america.jpg', '/legacy/lab-certificates/gia-gemological-institute-of-america.jpg', 90)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    lab_name = EXCLUDED.lab_name,
    certificate_url = EXCLUDED.certificate_url,
    thumbnail_url = EXCLUDED.thumbnail_url,
    sort_order = EXCLUDED.sort_order;

INSERT INTO feedback_submissions (name, location, rating, subject, message, allow_display, status, is_featured, created_at)
VALUES
('Tran Thi Yen Van', 'VietNam', 5, 'Genuine products and patient guidance', 'Firstly, I want to give compliment to the website. By chance, I came to know the shop from the Internet only. The design of the website attract me a lot as well as it gives many useful knowledge about Astrology, gemstones, etc. After that, I feel thankful to Mr.Vikas Ji and his staffs for their understanding, support me from A to Z and help me solve all my problems. Whatever I do not understand, they guide me very slowly, clearly and remove all my doubts. They are great people - I have to say!!! Thanks a ton. Finally, the products are very good and give me positive result till now.', true, 'approved', true, NOW() - INTERVAL '9 days'),
('Anagha', 'PORTLAND, U.S.A', 5, 'Detailed and patient advice', 'As recommended by Astrologer, I purchased the gemstones. I must say that they have a unique role. After 3 months of wearing them, intuitively these have guided me in the right direction and given me a lot of strength in my convictions and getting beyond false sense of securities in life. I am grateful to Vikas Mehra Ji for his time, his advice and detailed and patient way of dealing with customers.', true, 'approved', true, NOW() - INTERVAL '8 days'),
('Sunil Kalwani', 'Los Angeles, U.S.A', 5, 'Wonderful service and delivery', 'The service was wonderful. Delivery and updates were very prompt and the pictures were incredibly appreciated. The ring itself has been fantastic. I wear it everyday and can feel the effects of it. Very grateful to have found you and will recommend you to friends looking for gemstones and use your service for any of my own future needs!', true, 'approved', true, NOW() - INTERVAL '7 days'),
('Baljit Bains', 'South Australia', 5, 'Helpful team throughout the process', 'I bought two gemstones from Pure Vedic Gems. Vikas ji gave me valuable advice and the team answered all my questions patiently. They helped me on every step of this process. I will highly recommend Pure Vedic Gems especially to overseas clients.', true, 'approved', false, NOW() - INTERVAL '6 days'),
('Shweta', 'Sydney', 5, 'Authentic and responsive', 'It was great talking to Vikas, I found him very knowledgeable, and he helped me choose the right product. Pure Vedic Gems team is very helpful, sorted out my queries and was very responsive. I received the product on time and it is a wonderful piece of gem.', true, 'approved', false, NOW() - INTERVAL '5 days'),
('M Bakeer', 'Nepean, Canada', 5, 'Careful ring setup and energized stone', 'Right away as soon as I started my order I was contacted by Pure Vedic Gems team to make sure everything was set up perfectly for my ring to be made. They walked me through the whole process up to delivery. The stone was very good quality and well energized.', true, 'approved', false, NOW() - INTERVAL '4 days'),
('Nitin', 'UK', 5, 'Excellent customer service', 'I am very impressed with the quality of the gemstone, reasonable pricing, finishing and perfection with which it is embedded into ring. The overall services such as day to day interaction, resolving queries with quick responses and delivery on time in secure packing were excellent.', true, 'approved', false, NOW() - INTERVAL '3 days'),
('Gurpreet Singh', 'Urban Estate', 5, 'Trusted stop for Vedic gemstones', 'A final destination when you are searching for pure unheated untreated Vedic Gemstones. I bought Emerald from Pure Vedic Gems. It is really very nice quality as promised. The one trusted stop is Mr Vikas whose true and valuable guidance will surely make you go for a real stone.', true, 'approved', false, NOW() - INTERVAL '2 days'),
('Bibi Hazra', 'MAURITIUS', 5, 'High quality gemstones', 'I bought 2 gemstones Yellow Sapphire and Red Coral from Pure Vedic Gems and I am very pleased with the products and customer services. The gemstones were high quality and very beautiful. Pure Vedic Gems team was very helpful throughout the journey.', true, 'approved', false, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

COMMIT;
