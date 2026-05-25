'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { MessageCircle, Send, Star } from 'lucide-react';

export interface PublicFeedbackReply {
  id: string;
  feedback_id: string;
  name: string;
  message: string;
  created_at: string;
}

export interface PublicFeedbackItem {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  subject: string | null;
  message: string;
  created_at: string;
  replies: PublicFeedbackReply[];
}

interface ReplyFormState {
  name: string;
  email: string;
  message: string;
}

const EMPTY_REPLY: ReplyFormState = { name: '', email: '', message: '' };

function FeedbackStars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5 text-[#d99a2b]" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className="h-4 w-4" fill={index < rating ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function FeedbackThread({ items }: { items: PublicFeedbackItem[] }) {
  const [feedback, setFeedback] = useState(items);
  const [openId, setOpenId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, ReplyFormState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});

  function updateForm(feedbackId: string, key: keyof ReplyFormState, value: string) {
    setForms((prev) => ({
      ...prev,
      [feedbackId]: { ...(prev[feedbackId] ?? EMPTY_REPLY), [key]: value },
    }));
  }

  async function submitReply(event: FormEvent<HTMLFormElement>, feedbackId: string) {
    event.preventDefault();
    const form = forms[feedbackId] ?? EMPTY_REPLY;
    setSavingId(feedbackId);
    setError((prev) => ({ ...prev, [feedbackId]: '' }));

    const response = await fetch('/api/feedback-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback_id: feedbackId, ...form }),
    });
    const data = await response.json().catch(() => null) as { reply?: PublicFeedbackReply; error?: string } | null;
    setSavingId(null);

    if (!response.ok || !data?.reply) {
      setError((prev) => ({ ...prev, [feedbackId]: data?.error ?? 'Could not submit reply.' }));
      return;
    }

    setFeedback((prev) => prev.map((item) => (
      item.id === feedbackId ? { ...item, replies: [...item.replies, data.reply!] } : item
    )));
    setForms((prev) => ({ ...prev, [feedbackId]: EMPTY_REPLY }));
    setOpenId(null);
  }

  if (feedback.length === 0) return null;

  return (
    <section className="mx-auto mt-14 max-w-4xl">
      <div className="mb-6 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#b86654]">Shared Experiences</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-[#15110d] sm:text-4xl">Customer feedback</h2>
      </div>

      <div className="space-y-5">
        {feedback.map((item) => {
          const form = forms[item.id] ?? EMPTY_REPLY;
          return (
            <article key={item.id} className="border border-[#e5d7c8] bg-white p-5 shadow-[0_14px_40px_rgba(46,30,16,0.06)] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-black text-[#15110d]">{item.name}</h3>
                    <FeedbackStars rating={item.rating} />
                  </div>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f7b69]">
                    {[item.location, formatDate(item.created_at)].filter(Boolean).join(' | ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                  className="inline-flex items-center justify-center gap-2 border border-[#d9c3aa] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b3b23] transition hover:border-[#b86654] hover:text-[#b86654]"
                >
                  <MessageCircle className="h-4 w-4" /> Reply
                </button>
              </div>

              {item.subject ? <p className="mt-4 font-black text-[#4a2f1f]">{item.subject}</p> : null}
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#5e4a38]">{item.message}</p>

              {item.replies.length > 0 ? (
                <div className="mt-5 space-y-3 border-l-2 border-[#efd9be] pl-4">
                  {item.replies.map((reply) => (
                    <div key={reply.id} className="bg-[#fbfaf7] px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-black text-[#3c2719]">{reply.name}</span>
                        <span className="text-[#9a8572]">{formatDate(reply.created_at)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#5e4a38]">{reply.message}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {openId === item.id ? (
                <form onSubmit={(event) => submitReply(event, item.id)} className="mt-5 grid gap-3 border border-[#eadcca] bg-[#fffaf2] p-4 sm:grid-cols-2">
                  {error[item.id] ? <p className="border border-[#f0c4be] bg-[#fdf3f2] px-3 py-2 text-sm text-[#b53a2f] sm:col-span-2">{error[item.id]}</p> : null}
                  <input
                    required
                    maxLength={180}
                    placeholder="Your name"
                    value={form.name}
                    onChange={(event) => updateForm(item.id, 'name', event.target.value)}
                    className="h-11 border border-[#d9d4cb] bg-white px-3 text-sm outline-none focus:border-[#b86654]"
                  />
                  <input
                    required
                    type="email"
                    maxLength={255}
                    placeholder="Email"
                    value={form.email}
                    onChange={(event) => updateForm(item.id, 'email', event.target.value)}
                    className="h-11 border border-[#d9d4cb] bg-white px-3 text-sm outline-none focus:border-[#b86654]"
                  />
                  <textarea
                    required
                    rows={3}
                    maxLength={1500}
                    placeholder="Write a reply"
                    value={form.message}
                    onChange={(event) => updateForm(item.id, 'message', event.target.value)}
                    className="resize-y border border-[#d9d4cb] bg-white px-3 py-3 text-sm outline-none focus:border-[#b86654] sm:col-span-2"
                  />
                  <button
                    type="submit"
                    disabled={savingId === item.id}
                    className="inline-flex h-11 items-center justify-center gap-2 bg-[#f36b5b] px-5 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#e45d4e] disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
                  >
                    {savingId === item.id ? 'Sending...' : 'Post Reply'} <Send className="h-4 w-4" />
                  </button>
                </form>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}