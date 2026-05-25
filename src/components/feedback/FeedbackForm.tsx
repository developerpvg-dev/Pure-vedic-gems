'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Send } from 'lucide-react';

const INITIAL = {
  name: '',
  gender: '',
  occupation: '',
  company_name: '',
  designation: '',
  phone: '',
  email: '',
  address: '',
  products: '',
  message: '',
};

const inputClass =
  'h-11 w-full border border-[#d9d4cb] bg-transparent px-4 text-sm outline-none transition placeholder:text-[#9e9892] focus:border-[#b86654] focus:bg-white/60';

export function FeedbackForm() {
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function set(key: keyof typeof INITIAL) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    // Pack extra fields into message body
    const fullMessage = [
      form.occupation && `Occupation: ${form.occupation}`,
      form.company_name && `Company: ${form.company_name}`,
      form.designation && `Designation: ${form.designation}`,
      `\n${form.message}`,
    ]
      .filter(Boolean)
      .join('\n');

    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${form.name}${form.gender ? ` (${form.gender})` : ''}`,
        email: form.email,
        phone: form.phone,
        location: form.address,
        subject: form.products,
        message: fullMessage,
        allow_display: true,
      }),
    });

    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    setSaving(false);

    if (!response.ok) {
      setError(data?.error ?? 'Unable to submit. Please try again.');
      return;
    }
    setForm(INITIAL);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="border border-[#b7d4b9] bg-[#f2faf3] px-6 py-8 text-center">
        <p className="text-lg font-black text-[#2d6b34]">Thank you for your feedback!</p>
        <p className="mt-2 text-sm text-[#4a7a50]">
          Your submission is pending moderation and will be published shortly.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-5 text-sm font-bold underline text-[#b86654]"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      {error && (
        <p className="border border-[#f0c4be] bg-[#fdf3f2] px-4 py-3 text-sm text-[#b53a2f]">
          {error}
        </p>
      )}

      <input required maxLength={200} placeholder="Name *" value={form.name} onChange={set('name')} className={inputClass} />

      {/* Gender */}
      <div className="flex items-center gap-6 border border-[#d9d4cb] bg-transparent px-4 py-3 text-sm text-[#15110d]">
        <span className="text-[#9e9892]">Gender *</span>
        {['Male', 'Female'].map((g) => (
          <label key={g} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="gender"
              value={g}
              required
              checked={form.gender === g}
              onChange={() => setForm((prev) => ({ ...prev, gender: g }))}
              className="accent-[#b86654]"
            />
            {g}
          </label>
        ))}
      </div>

      <input required maxLength={150} placeholder="Occupation *" value={form.occupation} onChange={set('occupation')} className={inputClass} />
      <input maxLength={200} placeholder="Company Name" value={form.company_name} onChange={set('company_name')} className={inputClass} />
      <input maxLength={150} placeholder="Designation" value={form.designation} onChange={set('designation')} className={inputClass} />
      <input required maxLength={30} placeholder="Contact No. *" value={form.phone} onChange={set('phone')} className={inputClass} />
      <input required type="email" maxLength={255} placeholder="Email-id *" value={form.email} onChange={set('email')} className={inputClass} />
      <input required maxLength={300} placeholder="Address *" value={form.address} onChange={set('address')} className={inputClass} />
      <input required maxLength={300} placeholder="Product / Products purchased *" value={form.products} onChange={set('products')} className={inputClass} />
      <textarea
        required
        rows={5}
        maxLength={3000}
        placeholder="Message *"
        value={form.message}
        onChange={set('message')}
        className="w-full resize-y border border-[#d9d4cb] bg-transparent px-4 py-3 text-sm outline-none transition placeholder:text-[#9e9892] focus:border-[#b86654] focus:bg-white/60"
      />

      <button
        type="submit"
        disabled={saving}
        className="inline-flex h-12 w-full items-center justify-center gap-2 bg-[#f36b5b] text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#e45d4e] disabled:opacity-60"
      >
        {saving ? 'Submitting…' : 'Submit Feedback'} <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
