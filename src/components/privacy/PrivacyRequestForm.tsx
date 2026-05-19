'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

const REQUEST_TYPES = [
  { value: 'data_export', label: 'Export my data' },
  { value: 'data_deletion', label: 'Delete my data' },
  { value: 'data_correction', label: 'Correct my data' },
  { value: 'consent_withdrawal', label: 'Withdraw consent' },
  { value: 'marketing_unsubscribe', label: 'Unsubscribe from marketing' },
] as const;

export function PrivacyRequestForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch('/api/privacy-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus('error');
      setMessage(data.error || 'Unable to submit your request. Please contact support.');
      return;
    }
    event.currentTarget.reset();
    setStatus('success');
    setMessage(`Request received. Reference: ${data.request?.id ?? 'created'}`);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-sm border border-border bg-card p-6 shadow-sm">
      <h2 className="font-heading text-xl font-semibold text-primary">Submit a Privacy Request</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Use this form for DPDP/GDPR-style export, correction, deletion, consent withdrawal, or unsubscribe requests. We verify ownership before making account or order-data changes.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-primary">
          Request Type
          <select name="request_type" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground" required>
            {REQUEST_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-primary">
          Full Name
          <input name="full_name" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground" required minLength={2} maxLength={220} />
        </label>
        <label className="text-sm font-medium text-primary">
          Email
          <input name="email" type="email" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground" required />
        </label>
        <label className="text-sm font-medium text-primary">
          Phone
          <input name="phone" type="tel" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground" maxLength={30} />
        </label>
      </div>
      <label className="mt-4 block text-sm font-medium text-primary">
        Details
        <textarea name="message" rows={4} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground" maxLength={2000} />
      </label>
      {message && (
        <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </p>
      )}
      <button disabled={status === 'submitting'} className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-60">
        <Send className="h-4 w-4" />
        {status === 'submitting' ? 'Submitting...' : 'Submit request'}
      </button>
    </form>
  );
}