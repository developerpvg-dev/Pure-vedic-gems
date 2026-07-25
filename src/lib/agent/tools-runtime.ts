import { createAdminClient } from '@/lib/supabase/admin';
import { productHref } from '@/lib/categories/storefront';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { sendEnquiryEmails } from '@/lib/resend/send-enquiry';
import { applyProductIlikeSearch } from '@/lib/shop/product-search';
import { applyShopAvailabilityFilter } from '@/lib/shop/listing';
import { buildGemRecommendation } from '@/lib/utils/rashi-calculator';
import { searchAgentKnowledge } from '@/lib/agent/knowledge';
import { mergeSessionContext } from '@/lib/agent/session';
import type { AgentLocale, AgentProductCard, AgentSessionContext } from '@/lib/agent/types';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';

const PRODUCT_SELECT =
  'id, slug, name, hindi_name, category, sub_category, price, thumbnail_url, planet, in_stock, images';

function toProductCard(row: Record<string, unknown>): AgentProductCard {
  const category = String(row.category ?? '');
  const subCategory = row.sub_category ? String(row.sub_category) : null;
  const slug = String(row.slug ?? '');
  return {
    id: String(row.id),
    name: formatProductDisplayName(String(row.name ?? '')),
    hindiName: row.hindi_name ? String(row.hindi_name) : null,
    slug,
    href: productHref({ category, sub_category: subCategory, slug }),
    price: typeof row.price === 'number' ? row.price : null,
    thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : null,
    planet: row.planet ? String(row.planet) : null,
    inStock: Boolean(row.in_stock),
  };
}

export async function agentSearchProducts(query: string, planet?: string, limit = 5) {
  const admin = createAdminClient();
  let q = admin
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .limit(Math.min(limit, 5));

  q = applyShopAvailabilityFilter(q, {});
  if (planet) q = q.ilike('planet', `%${planet}%`);
  q = applyProductIlikeSearch(q, query);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toProductCard(row as Record<string, unknown>));
}

export async function agentGetProduct(idOrSlug: string) {
  const admin = createAdminClient();
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
  const { data, error } = await (isUuid
    ? admin.from('products').select(PRODUCT_SELECT).eq('id', idOrSlug).eq('is_active', true).maybeSingle()
    : admin.from('products').select(PRODUCT_SELECT).eq('slug', idOrSlug).eq('is_active', true).maybeSingle());

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toProductCard(data as Record<string, unknown>);
}

export async function agentRecommendGem(
  sessionId: string,
  input: {
    birthDate?: string;
    rashi?: string;
    purpose?: string;
    budgetMin?: number;
    budgetMax?: number;
  }
) {
  const recommendation = buildGemRecommendation(input);
  await mergeSessionContext(sessionId, {
    birthDate: input.birthDate,
    purpose: input.purpose,
    budgetMin: input.budgetMin,
    budgetMax: input.budgetMax,
    lastRecommendation: recommendation as unknown as Record<string, unknown>,
  });

  return recommendation;
}

export async function agentSearchKnowledge(query: string, locale?: AgentLocale) {
  const results = await searchAgentKnowledge(query, locale, 5);
  return results.map((r) => ({
    title: r.title,
    content: r.content.slice(0, 500),
    language: r.language,
    source: r.source,
  }));
}

export async function agentCreateEnquiry(
  sessionId: string,
  input: {
    name: string;
    email: string;
    phone?: string;
    message: string;
    productId?: string;
  }
) {
  const admin = createAdminClient();
  const { data: enquiry, error } = await admin
    .from('enquiries')
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      subject: 'Ratna AI consultation',
      message: input.message,
      product_id: input.productId ?? null,
      source: 'agent_chat',
      status: 'new',
      pipeline_stage: 'new',
      enquiry_type: 'Enquiry',
    })
    .select('id')
    .single();

  if (error || !enquiry) throw new Error(error?.message ?? 'Failed to create enquiry');

  await mergeSessionContext(sessionId, {
    name: input.name,
    email: input.email,
    phone: input.phone,
  });
  const { updateAgentSession } = await import('@/lib/agent/session');
  await updateAgentSession(sessionId, { enquiry_id: enquiry.id });

  await Promise.allSettled([
    sendEnquiryEmails({
      id: enquiry.id,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      subject: 'Ratna AI consultation',
      message: input.message,
      source: 'agent_chat',
      productId: input.productId ?? null,
    }),
    createInAppNotifications([
      {
        audience: 'admin',
        type: 'enquiry',
        title: 'New Ratna AI lead',
        message: `${input.name} via AI agent`,
        href: `/admin/leads?type=enquiry`,
        metadata: { enquiry_id: enquiry.id, session_id: sessionId },
      },
    ]),
  ]);

  return { enquiryId: enquiry.id };
}

export async function agentRecordConsent(sessionId: string) {
  const admin = createAdminClient() as unknown as {
    from: (t: string) => {
      update: (row: Record<string, unknown>) => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  };
  await admin.from('agent_sessions').update({ consent_at: new Date().toISOString() }).eq('id', sessionId);
  return { ok: true };
}

export async function agentTrackProductView(sessionId: string, productId: string) {
  const session = await mergeSessionContext(sessionId, {});
  const views = (session.context.productViews ?? 0) + 1;
  const recommended = [...(session.context.recommendedProducts ?? [])];
  if (!recommended.includes(productId)) recommended.push(productId);
  await mergeSessionContext(sessionId, { productViews: views, recommendedProducts: recommended });
  return { productViews: views };
}

export async function agentRecordUrgency(sessionId: string, signal: string) {
  const session = await mergeSessionContext(sessionId, {});
  const signals = [...(session.context.urgencySignals ?? [])];
  if (!signals.includes(signal)) signals.push(signal);
  await mergeSessionContext(sessionId, { urgencySignals: signals });
  return { urgencySignals: signals };
}
