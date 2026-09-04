'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
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
      setError('Please complete the security check.');
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
      const data = (await response.json()) as {
        error?: string;
        code?: string;
        comment?: BlogComment;
      };

      if (response.status === 401 || data.code === 'auth_required') {
        setAuthView('register');
        setAuthModalOpen(true);
        throw new Error(data.error || 'Please sign up to comment.');
      }
      if (!response.ok) {
        throw new Error(data.error || 'Unable to post your comment.');
      }

      const posted = data.comment;
      setBody('');
      turnstile.reset();
      setStatus('success');
      if (posted) {
        setComments((prev) => [...prev, posted]);
      } else {
        void loadComments();
      }
    } catch (submissionError) {
      setStatus('error');
      setError(
        submissionError instanceof Error ? submissionError.message : 'Unable to post your comment.'
      );
    }
  }

  const displayName = profile?.full_name?.trim() || 'there';

  return (
    <section className="pvg-blog-comments" aria-labelledby="blog-comments-heading">
      {turnstile.script}

      <div className="pvg-blog-comments-head">
        <h2 id="blog-comments-heading">
          Comments
          {!loadingComments && comments.length > 0 ? (
            <span className="pvg-blog-comments-count">({comments.length})</span>
          ) : null}
        </h2>
      </div>

      {authLoading ? (
        <p className="pvg-blog-comments-loading" aria-live="polite">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Checking account…
        </p>
      ) : !isAuthenticated ? (
        <div className="pvg-blog-comments-auth">
          <p>Sign up free to leave a comment.</p>
          <div className="pvg-blog-comments-auth-actions">
            <button
              type="button"
              className="pvg-blog-cta-link"
              onClick={() => {
                setAuthView('register');
                setAuthModalOpen(true);
              }}
            >
              Sign up
            </button>
            <button
              type="button"
              className="pvg-blog-cta-link pvg-blog-cta-link--outline"
              onClick={() => {
                setAuthView('login');
                setAuthModalOpen(true);
              }}
            >
              Log in
            </button>
          </div>
        </div>
      ) : (
        <form className="pvg-blog-comments-form" onSubmit={onSubmit}>
          <label htmlFor={`blog-comment-${blogSlug}`}>
            Comment as {displayName}
            <textarea
              id={`blog-comment-${blogSlug}`}
              name="body"
              rows={2}
              required
              minLength={3}
              maxLength={2000}
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
                if (status === 'success') setStatus('idle');
              }}
              disabled={status === 'submitting'}
              placeholder="Share your thoughts…"
            />
          </label>
          <div className="pvg-blog-comments-turnstile-wrap">{turnstile.field}</div>
          {status === 'success' ? (
            <p className="pvg-blog-form-success" role="status">
              Comment posted.
            </p>
          ) : null}
          {status === 'error' && error ? (
            <p className="pvg-blog-form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={status === 'submitting' || body.trim().length < 3 || !turnstileReady}
          >
            {status === 'submitting' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Posting…
              </>
            ) : (
              'Post comment'
            )}
          </button>
        </form>
      )}

      <div className="pvg-blog-comments-list" aria-live="polite">
        {loadingComments ? (
          <p className="pvg-blog-comments-loading">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Loading…
          </p>
        ) : comments.length === 0 ? (
          <p className="pvg-blog-comments-empty">No comments yet.</p>
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
