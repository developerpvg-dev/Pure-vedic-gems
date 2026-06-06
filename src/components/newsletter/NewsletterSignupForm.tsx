'use client';

import { FormEvent, useState, useTransition } from 'react';
import { Mail } from 'lucide-react';

type NewsletterState = 'idle' | 'success' | 'error';

export function NewsletterSignupForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState<NewsletterState>('idle');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('idle');
    setMessage('');

    startTransition(async () => {
      try {
        const response = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, source: 'footer' }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Unable to subscribe right now.');
        setEmail('');
        setName('');
        setState('success');
        setMessage('You are subscribed.');
      } catch (error) {
        setState('error');
        setMessage(error instanceof Error ? error.message : 'Unable to subscribe right now.');
      }
    });
  }

  return (
    <form className="pvg-newsletter-form" onSubmit={handleSubmit}>
      <div className="pvg-newsletter-heading">
        <Mail size={17} aria-hidden="true" />
        <span>Newsletter</span>
      </div>
      <div className="pvg-newsletter-fields">
        <input
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email address"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button type="submit" disabled={isPending}>{isPending ? 'Joining...' : 'Join'}</button>
      </div>
      <p className={`pvg-newsletter-status pvg-newsletter-status--${state}`} aria-live="polite">
        {message || 'Gemstone guidance and offers, only when useful.'}
      </p>
    </form>
  );
}
