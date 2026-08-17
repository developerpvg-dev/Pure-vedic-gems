'use client';

import { useState } from 'react';
import { Flame, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTurnstile } from '@/components/turnstile/use-turnstile';

export interface YagyaOption {
  id: string;
  name: string;
}

export function YagyaBookingForm({
  yagyas,
  preselectedId = '',
  preselectedName = '',
}: {
  yagyas: YagyaOption[];
  preselectedId?: string;
  preselectedName?: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [yagyaId, setYagyaId] = useState(preselectedId);
  const [preferredDate, setPreferredDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [formStartedAt] = useState(() => Date.now());
  const turnstile = useTurnstile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !turnstile.ready) return;

    const selected = yagyas.find((y) => y.id === yagyaId);
    const yagyaName = selected?.name ?? preselectedName ?? 'General enquiry';
    const subject = `Yagya Booking — ${yagyaName}`.slice(0, 200);
    const parts = [
      preferredDate ? `Preferred date: ${preferredDate}` : null,
      message.trim() ? message.trim() : null,
    ].filter(Boolean);
    const fullMessage = parts.length > 0 ? parts.join('\n\n') : `Please contact me to book the ${yagyaName}.`;

    setSubmitting(true);
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          subject,
          message: fullMessage,
          product_id: yagyaId || undefined,
          source: 'yagya_booking',
          _hp: honeypot,
          _startedAt: formStartedAt,
          turnstileToken: turnstile.token || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Failed to submit your request');
      }
      setDone(true);
      toast.success('Request received', {
        description: 'Our Vedic team will contact you shortly to arrange your yagya.',
      });
    } catch (err) {
      toast.error('Could not submit', {
        description: err instanceof Error ? err.message : 'Please try again in a moment.',
      });
    } finally {
      setSubmitting(false);
      turnstile.reset();
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <Flame className="h-7 w-7 text-amber-600" />
        </div>
        <h3 className="mt-4 font-serif text-xl font-semibold text-gray-900">Dhanyavaad!</h3>
        <p className="mt-2 text-gray-600">
          Your yagya booking request has been received. Our learned pandits&apos; team will reach out to confirm the
          sankalp details, auspicious muhurat and offerings.
        </p>
      </div>
    );
  }

  return (
    <>
      {turnstile.script}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm sm:p-8">
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
        <h3 className="font-serif text-xl font-semibold text-gray-900">Book / Enquire about a Yagya</h3>
      <p className="mt-1 text-sm text-gray-500">
        Share your details and the yagya you wish to have performed. Our team will guide you through the entire ritual.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="yagya-select" className="mb-1 block text-sm font-medium text-gray-700">
            Yagya / Pooja
          </label>
          <select
            id="yagya-select"
            value={yagyaId}
            onChange={(e) => setYagyaId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Not sure / Recommend for me</option>
            {yagyas.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="yagya-name" className="mb-1 block text-sm font-medium text-gray-700">
            Full name<span className="text-red-500">*</span>
          </label>
          <input
            id="yagya-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div>
          <label htmlFor="yagya-phone" className="mb-1 block text-sm font-medium text-gray-700">
            Phone / WhatsApp
          </label>
          <input
            id="yagya-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div>
          <label htmlFor="yagya-email" className="mb-1 block text-sm font-medium text-gray-700">
            Email<span className="text-red-500">*</span>
          </label>
          <input
            id="yagya-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div>
          <label htmlFor="yagya-date" className="mb-1 block text-sm font-medium text-gray-700">
            Preferred date
          </label>
          <input
            id="yagya-date"
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="yagya-message" className="mb-1 block text-sm font-medium text-gray-700">
            Your message / gotra &amp; rashi details
          </label>
          <textarea
            id="yagya-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us your name, gotra, rashi or the purpose of the yagya so we can guide you better."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {turnstile.field}

      <button
        type="submit"
        disabled={submitting || !turnstile.ready}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Flame className="h-5 w-5" />}
        {submitting ? 'Submitting…' : 'Request Booking'}
      </button>
    </form>
    </>
  );
}
