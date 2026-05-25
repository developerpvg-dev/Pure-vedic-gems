'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { MessageCircle, Send, Star, X } from 'lucide-react';

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
const CHAR_LIMIT = 155;

function getInitials(name: string) {
  if (!name) return 'PG';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

/** Inline card face — overlaid on cardbg.png */
function CardFace({
  item,
  preview,
  isLong,
  onReadMore,
}: {
  item: PublicFeedbackItem;
  preview: string;
  isLong: boolean;
  onReadMore?: () => void;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col select-text"
      style={{ padding: '15% 34% 14% 9%' }}
    >
      {/* Stars — top right */}
      <div
        className="flex justify-end gap-0.5"
        style={{ marginBottom: '10px' }}
        aria-label={`${item.rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className="w-[clamp(12px,1.8vw,18px)] h-[clamp(12px,1.8vw,18px)]"
            fill={i < item.rating ? '#c99022' : 'none'}
            color="#c99022"
            style={{ margin: 0 }}
          />
        ))}
      </div>

      {/* Subject badge */}
      {item.subject && (
        <p
          className="font-semibold text-[#4a2f1f] truncate"
          style={{ fontSize: 'clamp(9px,1vw,11px)', marginBottom: '4px' }}
        >
          {item.subject}
        </p>
      )}

      {/* Opening quote + message preview */}
      <div className="flex items-start gap-1.5" style={{ marginBottom: '4px' }}>
        <span
          aria-hidden="true"
          className="shrink-0 select-none text-[#8c5e2a] leading-none"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(28px, 4.5vw, 52px)',
            lineHeight: '0.6',
            marginTop: '4px',
          }}
        >
          &#8220;&#8220;
        </span>
        <p
          className="text-[clamp(11px,1.3vw,14px)] text-[#2c1810] leading-[1.55]"
          style={{ textAlign: 'left', margin: 0 }}
        >
          {preview}
        </p>
      </div>

      {isLong && onReadMore && (
        <button
          onClick={onReadMore}
          className="self-start text-[clamp(10px,1.1vw,12px)] font-semibold text-[#8c6d3f] border-b border-[#8c6d3f] hover:text-[#5c3d1e] transition-colors cursor-pointer"
          style={{ marginTop: '4px', background: 'none' }}
          aria-label={`Read full feedback from ${item.name}`}
        >
          Read more ›
        </button>
      )}

      {/* Flex spacer pushes author to bottom */}
      <div style={{ flex: '1 1 auto', minHeight: 0 }} />

      {/* Divider */}
      <div className="border-t border-[#cfc0a0]" style={{ marginBottom: '8px' }} />

      {/* Author row */}
      <div className="flex items-center gap-2">
        <div
          className="shrink-0 rounded-full bg-[#ecdbb0] border border-[#c9a96e] flex items-center justify-center"
          style={{ width: 'clamp(28px,3.2vw,38px)', height: 'clamp(28px,3.2vw,38px)' }}
        >
          <span
            className="font-bold text-[#6b3b23] leading-none"
            style={{ fontSize: 'clamp(9px,1vw,11px)', margin: 0 }}
          >
            {getInitials(item.name)}
          </span>
        </div>
        <div className="min-w-0" style={{ flex: 1 }}>
          <p
            className="font-bold text-[#1a1208] leading-tight truncate"
            style={{ fontSize: 'clamp(11px,1.2vw,13px)', margin: 0 }}
          >
            {item.name}
          </p>
          <p
            className="text-[#8c7456] leading-tight truncate"
            style={{ fontSize: 'clamp(9px,1vw,11px)', margin: 0 }}
          >
            {[item.location, formatDate(item.created_at)].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Modal card face — wider, shows full message */
function ModalCardFace({ item }: { item: PublicFeedbackItem }) {
  return (
    <div
      className="absolute inset-0 flex flex-col select-text"
      style={{ padding: '14% 33% 13% 8%' }}
    >
      <div
        className="flex justify-end gap-1"
        style={{ marginBottom: '16px' }}
        aria-label={`${item.rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="w-5 h-5" fill={i < item.rating ? '#c99022' : 'none'} color="#c99022" style={{ margin: 0 }} />
        ))}
      </div>

      {item.subject && (
        <p className="text-[13px] font-semibold text-[#4a2f1f]" style={{ marginBottom: '8px' }}>
          {item.subject}
        </p>
      )}

      <div className="flex items-start gap-3" style={{ flex: '1 1 auto', minHeight: 0 }}>
        <span
          aria-hidden="true"
          className="shrink-0 select-none text-[#8c5e2a] leading-none"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '56px', lineHeight: '0.6', marginTop: '4px' }}
        >
          &#8220;&#8220;
        </span>
        <p className="text-[14.5px] text-[#2c1810] leading-relaxed overflow-y-auto" style={{ textAlign: 'left', margin: 0 }}>
          {item.message}
        </p>
      </div>

      <div className="border-t border-[#cfc0a0]" style={{ marginTop: '16px', marginBottom: '10px' }} />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 shrink-0 rounded-full bg-[#ecdbb0] border border-[#c9a96e] flex items-center justify-center">
          <span className="text-[12px] font-bold text-[#6b3b23] leading-none" style={{ margin: 0 }}>{getInitials(item.name)}</span>
        </div>
        <div className="min-w-0" style={{ flex: 1 }}>
          <p className="text-[14px] font-bold text-[#1a1208] leading-tight" style={{ margin: 0 }}>{item.name}</p>
          <p className="text-[12px] text-[#8c7456] leading-tight" style={{ margin: 0 }}>
            {[item.location, formatDate(item.created_at)].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FeedbackThread({ items }: { items: PublicFeedbackItem[] }) {
  const [feedback, setFeedback] = useState(items);
  const [openId, setOpenId] = useState<string | null>(null);
  const [modalId, setModalId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, ReplyFormState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<Record<string, string>>({});

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
    setFormError((prev) => ({ ...prev, [feedbackId]: '' }));

    const response = await fetch('/api/feedback-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback_id: feedbackId, ...form }),
    });
    const data = (await response.json().catch(() => null)) as { reply?: PublicFeedbackReply; error?: string } | null;
    setSavingId(null);

    if (!response.ok || !data?.reply) {
      setFormError((prev) => ({ ...prev, [feedbackId]: data?.error ?? 'Could not submit reply.' }));
      return;
    }

    setFeedback((prev) => prev.map((item) => (
      item.id === feedbackId ? { ...item, replies: [...item.replies, data.reply!] } : item
    )));
    setForms((prev) => ({ ...prev, [feedbackId]: EMPTY_REPLY }));
    setOpenId(null);
  }

  if (feedback.length === 0) return null;

  const modalItem = modalId ? feedback.find((f) => f.id === modalId) : null;

  return (
    <>
      {/* ── Cards grid ──────────────────────────────────────────── */}
      <div className="grid gap-x-10 gap-y-16 grid-cols-1 md:grid-cols-2 w-full mx-auto">
        {feedback.map((item) => {
          const isLong = item.message.length > CHAR_LIMIT;
          const preview = isLong
            ? item.message.slice(0, CHAR_LIMIT).trimEnd() + '\u2026'
            : item.message;
          const form = forms[item.id] ?? EMPTY_REPLY;

          return (
            <div key={item.id} className="flex flex-col gap-3">
              {/* ── Inline card (cardbg.png style) ─────────────── */}
              <article
                className="relative select-none transform scale-[1.05] sm:scale-[1.02] md:scale-100 origin-center my-3 mx-2 md:my-0 md:mx-0"
                style={{ filter: 'drop-shadow(0 5px 20px rgba(61,43,31,0.12))' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/testimonial/cardbg.png"
                  alt=""
                  aria-hidden="true"
                  className="w-full h-auto pointer-events-none select-none block"
                  style={{ margin: 0, display: 'block', padding: 0 }}
                  draggable={false}
                />
                <CardFace
                  item={item}
                  preview={preview}
                  isLong={isLong}
                  onReadMore={() => setModalId(item.id)}
                />
              </article>

              {/* Replies thread */}
              {item.replies.length > 0 && (
                <div className="space-y-2 border-l-2 border-[#efd9be] pl-4">
                  {item.replies.map((reply) => (
                    <div key={reply.id} className="bg-white/70 px-4 py-3 border border-[#ede3d3]">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#3c2719]">{reply.name}</span>
                        <span className="text-[11px] text-[#9a8572]">{formatDate(reply.created_at)}</span>
                      </div>
                      <p className="text-sm text-[#5e4a38] leading-relaxed">{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply toggle button */}
              <div className="flex items-center gap-3 px-1">
                <button
                  type="button"
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b3b23] border border-[#d8bd75] px-4 py-2 hover:bg-[#d8bd75] hover:text-white transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {item.replies.length > 0
                    ? `${item.replies.length} Repl${item.replies.length === 1 ? 'y' : 'ies'}`
                    : 'Reply'}
                </button>
              </div>

              {/* Inline reply form */}
              {openId === item.id && (
                <form
                  onSubmit={(event) => submitReply(event, item.id)}
                  className="grid gap-3 border border-[#eadcca] bg-[#fffaf2] p-4 sm:grid-cols-2"
                >
                  {formError[item.id] && (
                    <p className="border border-[#f0c4be] bg-[#fdf3f2] px-3 py-2 text-sm text-[#b53a2f] sm:col-span-2">
                      {formError[item.id]}
                    </p>
                  )}
                  <input
                    required
                    maxLength={180}
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => updateForm(item.id, 'name', e.target.value)}
                    className="h-11 border border-[#d9d4cb] bg-white px-3 text-sm outline-none focus:border-[#b86654]"
                  />
                  <input
                    required
                    type="email"
                    maxLength={255}
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => updateForm(item.id, 'email', e.target.value)}
                    className="h-11 border border-[#d9d4cb] bg-white px-3 text-sm outline-none focus:border-[#b86654]"
                  />
                  <textarea
                    required
                    rows={3}
                    maxLength={1500}
                    placeholder="Write a reply"
                    value={form.message}
                    onChange={(e) => updateForm(item.id, 'message', e.target.value)}
                    className="resize-y border border-[#d9d4cb] bg-white px-3 py-3 text-sm outline-none focus:border-[#b86654] sm:col-span-2"
                  />
                  <button
                    type="submit"
                    disabled={savingId === item.id}
                    className="inline-flex h-11 items-center gap-2 bg-[#a37c44] px-5 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#8a6535] disabled:opacity-60"
                  >
                    {savingId === item.id ? 'Sending…' : 'Post Reply'}
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Read-more modal ───────────────────────────────────────── */}
      {modalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          style={{ background: 'rgba(15, 8, 4, 0.60)', backdropFilter: 'blur(5px)' }}
          onClick={() => setModalId(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Full feedback from ${modalItem.name}`}
        >
          <div
            className="relative w-full max-w-3xl"
            style={{ filter: 'drop-shadow(0 8px 32px rgba(61,43,31,0.20))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/testimonial/cardbg.png"
              alt=""
              aria-hidden="true"
              className="w-full h-auto pointer-events-none select-none block"
              draggable={false}
            />
            <ModalCardFace item={modalItem} />
            <button
              onClick={() => setModalId(null)}
              className="absolute z-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition-colors"
              style={{ top: '8%', right: '4%', width: '32px', height: '32px' }}
              aria-label="Close"
            >
              <X className="w-4 h-4 text-[#6b3b23]" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}