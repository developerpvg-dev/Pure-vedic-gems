'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Loader2, MessageSquare, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTurnstile } from '@/components/turnstile/use-turnstile';
import { LoginModal } from '@/components/auth/LoginModal';
import { TURNSTILE_COMMENT_ACTION } from '@/lib/enquiry/verify-turnstile';

type BlogComment = {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
};

type BlogCommentsProps = {
  blogSlug: string;
};

export function BlogComments({ blogSlug }: BlogCommentsProps) {
  const { isAuthenticated, profile, isLoading: authLoading } = useAuth();
  const turnstile = useTurnstile({
    action: TURNSTILE_COMMENT_ACTION,
    className: 'pvg-blog-comments-turnstile',
  });

  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('register');

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/blog/comments?slug=${encodeURIComponent(blogSlug)}`);
      const data = (await response.json()) as { comments?: BlogComment[] };
      setComments(data.comments ?? []);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [blogSlug]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const turnstileReady = !turnstile.enabled || Boolean(turnstile.token);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated) {
      setAuthView('register');
      setAuthModalOpen(true);
      return;
    }
    if (!turnstileReady) {
      setError('Please complete the security check first.');
      return;
    }

    setStatus('submitting');
    setError('');

    try {
      const response = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blog_slug: blogSlug,
          body,
          turnstileToken: turnstile.token || undefined,
        }),
      });
      const data = (await response.json()) as { error?: string; code?: string };

      if (response.status === 401 || data.code === 'auth_required') {
        setAuthView('register');
        setAuthModalOpen(true);
        throw new Error(data.error || 'Please sign up to comment.');
      }
      if (!response.ok) {
        throw new Error(data.error || 'Unable to post your comment.');
      }

      setBody('');
      turnstile.reset();
      setStatus('success');
    } catch (submissionError) {
      setStatus('error');
      setError(
        submissionError instanceof Error ? submissionError.message : 'Unable to post your comment.'
      );
    }
  }

  function openSignup() {
    setAuthView('register');
    setAuthModalOpen(true);
  }

  function openLogin() {
    setAuthView('login');
    setAuthModalOpen(true);
  }

  const displayName = profile?.full_name?.trim() || 'there';

  return (
    <section className="pvg-blog-comments" aria-labelledby="blog-comments-heading">
      {turnstile.script}

      <div className="pvg-blog-comments-head">
        <MessageSquare className="h-5 w-5" aria-hidden="true" />
        <div>
          <p className="pvg-blog-section-eyebrow">Community</p>
          <h2 id="blog-comments-heading">Comments</h2>
        </div>
      </div>

      <div className="pvg-blog-comments-security">
        <p className="pvg-blog-comments-security-label">Step 1 — Security check</p>
        {turnstile.field}
        {turnstile.enabled && !turnstile.token ? (
          <p className="pvg-blog-comments-hint">Complete the check above to continue.</p>
        ) : null}
      </div>

      {turnstileReady ? (
        authLoading ? (
          <p className="pvg-blog-comments-loading" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Checking your account…
          </p>
        ) : !isAuthenticated ? (
          <div className="pvg-blog-comments-auth">
            <UserPlus className="h-5 w-5" aria-hidden="true" />
            <div>
              <p className="pvg-blog-comments-auth-title">Step 2 — Sign up to comment</p>
              <p className="pvg-blog-comments-auth-copy">
                Only registered customers can leave comments. Create a free account or sign in to join the discussion.
              </p>
            </div>
            <div className="pvg-blog-comments-auth-actions">
              <button type="button" className="pvg-blog-cta-link" onClick={openSignup}>
                Sign up free
              </button>
              <button
                type="button"
                className="pvg-blog-cta-link pvg-blog-cta-link--outline"
                onClick={openLogin}
              >
                Log in
              </button>
            </div>
          </div>
        ) : (
          <form className="pvg-blog-comments-form" onSubmit={onSubmit}>
            <p className="pvg-blog-comments-welcome">
              Step 2 — Commenting as <strong>{displayName}</strong>
            </p>
            <label htmlFor={`blog-comment-${blogSlug}`}>
              Your comment
              <textarea
                id={`blog-comment-${blogSlug}`}
                name="body"
                rows={4}
                required
                minLength={3}
                maxLength={2000}
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  if (status === 'success') setStatus('idle');
                }}
                disabled={status === 'submitting'}
                placeholder="Share your thoughts or questions about this article…"
              />
            </label>
            {status === 'success' ? (
              <p className="pvg-blog-form-success" role="status">
                Thank you! Your comment was submitted and will appear after review.
              </p>
            ) : null}
            {status === 'error' && error ? (
              <p className="pvg-blog-form-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={status === 'submitting' || body.trim().length < 3}
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Posting…
                </>
              ) : (
                'Post comment'
              )}
            </button>
          </form>
        )
      ) : null}

      <div className="pvg-blog-comments-list" aria-live="polite">
        <h3 className="pvg-blog-comments-list-title">
          {comments.length === 0 ? 'No comments yet' : `${comments.length} comment${comments.length === 1 ? '' : 's'}`}
        </h3>
        {loadingComments ? (
          <p className="pvg-blog-comments-loading">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading comments…
          </p>
        ) : comments.length === 0 ? (
          <p className="pvg-blog-comments-empty">Be the first to share your thoughts.</p>
        ) : (
          <ul>
            {comments.map((comment) => (
              <li key={comment.id} className="pvg-blog-comment-item">
                <div className="pvg-blog-comment-meta">
                  <strong>{comment.author_name}</strong>
                  <time dateTime={comment.created_at}>
                    {new Date(comment.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </div>
                <p>{comment.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <LoginModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authView}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </section>
  );
}
