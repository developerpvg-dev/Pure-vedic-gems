'use client';

import { useEffect, useRef } from 'react';
import { trackLeadFunnel } from '@/lib/utils/lead-funnel-client';
import type { LeadFunnel } from '@/lib/leads/funnel';

/** Fire one page_view per session for a lead funnel page. */
export function LeadFunnelPageView({
  funnel,
  blogSlug,
  countryHint,
}: {
  funnel: LeadFunnel;
  blogSlug?: string;
  countryHint?: string;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackLeadFunnel({
      funnel,
      event: 'page_view',
      blog_slug: blogSlug,
      country_hint: countryHint,
    });
  }, [funnel, blogSlug, countryHint]);
  return null;
}
