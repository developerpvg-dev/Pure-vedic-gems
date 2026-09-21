'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  clearLeadFunnelDraft,
  getLeadFunnelSessionId,
  trackLeadFunnel,
} from '@/lib/utils/lead-funnel-client';
import type { LeadFunnel, LeadFunnelDraftFields } from '@/lib/leads/funnel';

const DRAFT_DEBOUNCE_MS = 2500;

/**
 * Form focus → form_start; debounced draft upsert when email/phone present.
 * Call markSubmitted() after a successful full submit to drop the draft.
 */
export function useLeadFunnelForm(opts: {
  funnel: LeadFunnel;
  blogSlug?: string;
  countryHint?: string;
  source?: string;
  getDraft: () => LeadFunnelDraftFields;
}) {
  const formStartFired = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getDraftRef = useRef(opts.getDraft);
  getDraftRef.current = opts.getDraft;

  const onFormFocus = useCallback(() => {
    if (!formStartFired.current) {
      formStartFired.current = true;
      trackLeadFunnel({
        funnel: opts.funnel,
        event: 'form_start',
        blog_slug: opts.blogSlug,
        country_hint: opts.countryHint,
        source: opts.source,
      });
    }
  }, [opts.funnel, opts.blogSlug, opts.countryHint, opts.source]);

  const scheduleDraft = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      trackLeadFunnel({
        funnel: opts.funnel,
        blog_slug: opts.blogSlug,
        country_hint: opts.countryHint,
        source: opts.source,
        draft: getDraftRef.current(),
      });
    }, DRAFT_DEBOUNCE_MS);
  }, [opts.funnel, opts.blogSlug, opts.countryHint, opts.source]);

  const markSubmitted = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    clearLeadFunnelDraft(opts.funnel, opts.blogSlug);
  }, [opts.funnel, opts.blogSlug]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return {
    sessionId: typeof window !== 'undefined' ? getLeadFunnelSessionId() : '',
    onFormFocus,
    scheduleDraft,
    markSubmitted,
  };
}
