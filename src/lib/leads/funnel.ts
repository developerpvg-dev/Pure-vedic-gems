/** Lead funnel tracking — remedies / contact / consultation / blog. */

export const LEAD_FUNNELS = ['remedies', 'contact', 'consultation', 'blog'] as const;
export type LeadFunnel = (typeof LEAD_FUNNELS)[number];

export const LEAD_FUNNEL_EVENTS = [
  'page_view',
  'form_start',
  'pay_started',
  'pay_success',
  'pay_abandoned',
] as const;
export type LeadFunnelEvent = (typeof LEAD_FUNNEL_EVENTS)[number];

export function isLeadFunnel(value: string): value is LeadFunnel {
  return (LEAD_FUNNELS as readonly string[]).includes(value);
}

export function isLeadFunnelEvent(value: string): value is LeadFunnelEvent {
  return (LEAD_FUNNEL_EVENTS as readonly string[]).includes(value);
}

/** Map funnel → enquiries.source used by CRM inbox filters. */
export function funnelToEnquirySource(funnel: LeadFunnel, blogVariant?: 'popup' | 'sidebar'): string {
  if (funnel === 'remedies') return 'homepage_recommendation';
  if (funnel === 'contact') return 'contact_form';
  if (funnel === 'consultation') return 'consultation_page';
  return blogVariant === 'sidebar' ? 'blog_sidebar' : 'blog_popup';
}

export function funnelToEnquiryType(funnel: LeadFunnel): string {
  if (funnel === 'remedies') return 'Remedies Recommendation';
  if (funnel === 'consultation') return 'Consultation';
  if (funnel === 'blog') return 'Blog enquiry';
  return 'Enquiry';
}

export type LeadFunnelDraftFields = {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  subject?: string;
  date_of_birth?: string;
  birth_time?: string;
  birth_place?: string;
  customer_city?: string;
  customer_state?: string;
  customer_country?: string;
  area_of_concern?: string;
  blog_slug?: string;
};

/** Drafts only persist once we have a reachable contact. */
export function draftHasContact(draft: LeadFunnelDraftFields): boolean {
  const email = draft.email?.trim() ?? '';
  const phone = draft.phone?.trim() ?? '';
  return Boolean(email || phone);
}

export function assertLeadFunnelHelpers() {
  if (funnelToEnquirySource('remedies') !== 'homepage_recommendation') {
    throw new Error('remedies source');
  }
  if (funnelToEnquirySource('blog', 'sidebar') !== 'blog_sidebar') {
    throw new Error('blog sidebar source');
  }
  if (funnelToEnquiryType('contact') !== 'Enquiry') throw new Error('contact type');
  if (draftHasContact({})) throw new Error('empty draft must not save');
  if (!draftHasContact({ phone: '999' })) throw new Error('phone draft ok');
  if (!draftHasContact({ email: 'a@b.co' })) throw new Error('email draft ok');
  if (!isLeadFunnel('remedies') || isLeadFunnel('shop')) throw new Error('funnel guard');
  if (!isLeadFunnelEvent('page_view') || isLeadFunnelEvent('click')) throw new Error('event guard');
}
