import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { rateLimit } from '@/lib/utils/rate-limit';
import {
  draftHasContact,
  funnelToEnquirySource,
  funnelToEnquiryType,
  isLeadFunnel,
  isLeadFunnelEvent,
  type LeadFunnel,
  type LeadFunnelDraftFields,
} from '@/lib/leads/funnel';

type FunnelBody = {
  session_id?: string;
  funnel?: string;
  event?: string;
  page_path?: string;
  blog_slug?: string;
  country_hint?: string;
  /** Override enquiry source (e.g. blog_sidebar). */
  source?: string;
  draft?: LeadFunnelDraftFields;
  clear_draft?: boolean;
  meta?: Record<string, unknown>;
  _hp?: string;
};

function trimStr(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
}

async function clearDraft(
  admin: ReturnType<typeof createAdminClient>,
  sessionId: string,
  funnel: LeadFunnel,
  blogSlug: string | null,
  sourceOverride: string | null
) {
  const source = sourceOverride || funnelToEnquirySource(funnel);
  const db = asUntypedSupabase(admin);
  if (funnel === 'blog') {
    let q = db
      .from('enquiries')
      .delete()
      .eq('is_draft', true)
      .eq('draft_session_id', sessionId)
      .in('source', ['blog_popup', 'blog_sidebar']);
    if (blogSlug) q = q.eq('blog_slug', blogSlug);
    await q;
    return;
  }
  let q = db
    .from('enquiries')
    .delete()
    .eq('is_draft', true)
    .eq('draft_session_id', sessionId)
    .eq('source', source);
  if (blogSlug) q = q.eq('blog_slug', blogSlug);
  await q;
}

async function upsertDraft(
  admin: ReturnType<typeof createAdminClient>,
  sessionId: string,
  funnel: LeadFunnel,
  draft: LeadFunnelDraftFields,
  blogSlug: string | null,
  countryHint: string | null,
  sourceOverride: string | null
) {
  if (!draftHasContact(draft)) return;

  const source = sourceOverride || funnelToEnquirySource(funnel);
  const enquiryType = funnelToEnquiryType(funnel);
  const email = trimStr(draft.email, 255)?.toLowerCase() ?? '';
  const phone = trimStr(draft.phone, 40);
  const name = trimStr(draft.name, 200) || '(incomplete)';
  const message =
    trimStr(draft.message, 5000) ||
    trimStr(draft.area_of_concern, 5000) ||
    '(incomplete draft)';
  const slug = blogSlug || trimStr(draft.blog_slug, 200);

  const row = {
    name,
    email,
    phone,
    message,
    subject: trimStr(draft.subject, 200) || (slug ? `Draft · ${slug}` : 'Incomplete form'),
    source,
    status: 'new',
    pipeline_stage: 'new',
    enquiry_type: enquiryType,
    date_of_birth: trimStr(draft.date_of_birth, 40),
    birth_time: trimStr(draft.birth_time, 40),
    birth_place: trimStr(draft.birth_place, 500),
    customer_city: trimStr(draft.customer_city, 120),
    customer_state: trimStr(draft.customer_state, 120),
    customer_country: trimStr(draft.customer_country, 120) || countryHint,
    area_of_concern: trimStr(draft.area_of_concern, 5000),
    blog_slug: slug,
    is_draft: true,
    draft_session_id: sessionId,
    updated_at: new Date().toISOString(),
  };

  const db = asUntypedSupabase(admin);
  // Update-first: one round-trip when draft already exists (common while typing)
  let upd = db
    .from('enquiries')
    .update(row)
    .eq('is_draft', true)
    .eq('draft_session_id', sessionId)
    .eq('source', source)
    .select('id');
  if (slug) upd = upd.eq('blog_slug', slug);
  const { data: updated, error: updErr } = await upd;
  if (updErr) {
    console.error('[lead-funnel] draft update failed', updErr);
    return;
  }
  if (Array.isArray(updated) && updated.length) return;

  const { error: insErr } = await db.from('enquiries').insert(row);
  if (insErr && insErr.code !== '23505') {
    console.error('[lead-funnel] draft insert failed', insErr);
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  // ponytail: 40/min/IP — drafts + events share this bucket
  if (!rateLimit(`lead-funnel:${ip}`, 40, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: FunnelBody;
  try {
    body = (await request.json()) as FunnelBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body._hp && String(body._hp).trim()) {
    return NextResponse.json({ ok: true });
  }

  const sessionId = trimStr(body.session_id, 80);
  if (!sessionId || !body.funnel || !isLeadFunnel(body.funnel)) {
    return NextResponse.json({ error: 'Invalid session or funnel' }, { status: 400 });
  }
  if (!rateLimit(`lead-funnel-sid:${sessionId}`, 60, 60_000)) {
    return NextResponse.json({ ok: true });
  }

  const funnel = body.funnel;
  const blogSlug = trimStr(body.blog_slug, 200);
  const countryHint = trimStr(body.country_hint, 120);
  const pagePath = trimStr(body.page_path, 300);
  const sourceOverride = trimStr(body.source, 50);
  const clearDraftFlag =
    body.clear_draft === true || body.meta?.clear_draft === true || body.meta?.clear_draft === 'true';

  const admin = createAdminClient();

  if (clearDraftFlag) {
    await clearDraft(admin, sessionId, funnel, blogSlug, sourceOverride);
    return NextResponse.json({ ok: true });
  }

  if (body.draft && typeof body.draft === 'object') {
    await upsertDraft(admin, sessionId, funnel, body.draft, blogSlug, countryHint, sourceOverride);
  }

  if (body.event) {
    if (!isLeadFunnelEvent(body.event)) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }
    const meta =
      body.meta && typeof body.meta === 'object' && Object.keys(body.meta).length > 0
        ? body.meta
        : {};
    const db = asUntypedSupabase(admin);
    const { error } = await db.from('lead_funnel_events').insert({
      funnel,
      event: body.event,
      session_id: sessionId,
      page_path: pagePath,
      blog_slug: blogSlug,
      country_hint: countryHint,
      meta,
    });
    if (error && error.code !== '23505') {
      console.error('[lead-funnel] insert failed', error);
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
