-- Publish any comments that were waiting on the old moderation flow.
UPDATE blog_comments SET is_approved = true WHERE is_approved = false;
