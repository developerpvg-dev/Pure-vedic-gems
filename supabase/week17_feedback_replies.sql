-- ============================================================================
-- Week 17: Public feedback replies
-- Allows visitors to reply to approved public feedback while keeping emails private.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS feedback_replies (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id  UUID NOT NULL REFERENCES feedback_submissions(id) ON DELETE CASCADE,
    name         VARCHAR(180) NOT NULL,
    email        VARCHAR(255) NOT NULL,
    message      TEXT NOT NULL,
    status       VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('approved', 'hidden')),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_replies_public
  ON feedback_replies(feedback_id, status, created_at ASC);

ALTER TABLE feedback_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads approved feedback replies" ON feedback_replies;
CREATE POLICY "Public reads approved feedback replies"
  ON feedback_replies FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Anyone replies to feedback" ON feedback_replies;
CREATE POLICY "Anyone replies to feedback"
  ON feedback_replies FOR INSERT WITH CHECK (
    status = 'approved'
    AND EXISTS (
      SELECT 1
      FROM feedback_submissions
      WHERE feedback_submissions.id = feedback_replies.feedback_id
        AND feedback_submissions.status = 'approved'
        AND feedback_submissions.allow_display = true
    )
  );

DROP POLICY IF EXISTS "Admin manages feedback replies" ON feedback_replies;
CREATE POLICY "Admin manages feedback replies"
  ON feedback_replies FOR ALL USING (
    EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
  );

COMMIT;