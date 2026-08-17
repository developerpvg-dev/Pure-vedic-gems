'use client';

import { useState, type FormEvent } from 'react';
import { useTurnstile } from '@/components/turnstile/use-turnstile';

type BlogEnquiryFormProps = {
  postTitle: string;
  variant?: 'sidebar' | 'popup';
  onDirtyChange?: (dirty: boolean) => void;
  onSuccess?: () => void;
};

export function BlogEnquiryForm({
  postTitle,
  variant = 'sidebar',
  onDirtyChange,
  onSuccess,
}: BlogEnquiryFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [formStartedAt] = useState(() => Date.now());
  const turnstile = useTurnstile();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setError('');

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      message: String(form.get('message') ?? ''),
      subject: postTitle,
      source: 'blog_popup',
      enquiry_type: 'Blog enquiry',
      _hp: honeypot,
      _startedAt: formStartedAt,
      turnstileToken: turnstile.token || undefined,
    };

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to send your query.');
      onDirtyChange?.(false);
      onSuccess?.();
      setStatus('success');
    } catch (submissionError) {
      setStatus('error');
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to send your query.');
    } finally {
      turnstile.reset();
    }
  }

  if (status === 'success') {
    return <p className="pvg-blog-form-success" role="status">Thank you. Our gemstone team will contact you shortly.</p>;
  }

  return (
    <>
      {turnstile.script}
      <form
        className={`pvg-blog-query-form pvg-blog-query-form--${variant}`}
        onSubmit={onSubmit}
        onInput={() => onDirtyChange?.(true)}
      >
        <label className="sr-only" aria-hidden="true">
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </label>
        <label>
          Name
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          Phone
          <input name="phone" type="tel" autoComplete="tel" required />
        </label>
        <label>
          Email <span>(optional)</span>
          <input name="email" type="email" autoComplete="email" />
        </label>
        <label>
          Your query
          <textarea
            name="message"
            required
            rows={3}
            defaultValue={`I would like guidance about ${postTitle}.`}
            onChange={() => onDirtyChange?.(true)}
          />
        </label>
        {turnstile.field}
        {status === 'error' ? <p className="pvg-blog-form-error" role="alert">{error}</p> : null}
        <button type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : 'Request Expert Help'}
        </button>
      </form>
    </>
  );
}
