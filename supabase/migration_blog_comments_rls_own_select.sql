-- Fix: allow INSERT…RETURNING / own reads of pending comments.
-- Safe to run if the original blog_comments migration already ran.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_comments'
      AND policyname = 'Users read own blog comments'
  ) THEN
    CREATE POLICY "Users read own blog comments"
      ON blog_comments FOR SELECT
      USING (auth.uid() = customer_id);
  END IF;
END $$;
