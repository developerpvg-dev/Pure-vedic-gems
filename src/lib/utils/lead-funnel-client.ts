'use client';

import type { LeadFunnel, LeadFunnelDraftFields, LeadFunnelEvent } from '@/lib/leads/funnel';

const SESSION_KEY = 'pvg_lead_funnel_sid';

export function getLeadFunnelSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `anon-${Date.now()}`;
  }
}

/** page_view / form_start are unique per session in DB — skip repeat hits in this tab. */
const DEDUPE_EVENTS = new Set<LeadFunnelEvent>(['page_view', 'form_start']);
const firedKeys = new Set<string>();

export type TrackLeadFunnelInput = {
  funnel: LeadFunnel;
  event?: LeadFunnelEvent;
  page_path?: string;
  blog_slug?: string;
  country_hint?: string;
  source?: string;
  draft?: LeadFunnelDraftFields;
  meta?: Record<string, string | number | boolean | null>;
};

export function trackLeadFunnel(input: TrackLeadFunnelInput) {
  if (typeof window === 'undefined') return;

  const session_id = getLeadFunnelSessionId();
  if (!session_id) return;

  if (input.event && DEDUPE_EVENTS.has(input.event) && !input.draft) {
    const key = `${session_id}|${input.funnel}|${input.event}|${input.blog_slug ?? ''}`;
    if (firedKeys.has(key)) return;
    firedKeys.add(key);
  }

  const body = JSON.stringify({
    session_id,
    funnel: input.funnel,
    event: input.event,
    page_path: input.page_path ?? window.location.pathname,
    blog_slug: input.blog_slug,
    country_hint: input.country_hint,
    source: input.source,
    draft: input.draft,
    meta: input.meta,
  });

  const url = '/api/leads/funnel';
  try {
    if (navigator.sendBeacon && !input.draft) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    /* fall through */
  }

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

/** Clear matching draft after a successful full submit. */
export function clearLeadFunnelDraft(funnel: LeadFunnel, blog_slug?: string) {
  if (typeof window === 'undefined') return;
  const session_id = getLeadFunnelSessionId();
  if (!session_id) return;
  const body = JSON.stringify({
    session_id,
    funnel,
    blog_slug,
    clear_draft: true,
    page_path: window.location.pathname,
  });
  void fetch('/api/leads/funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
