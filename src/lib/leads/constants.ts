/** Lead CRM — one shared pipeline for manager / telecaller / astrologer */

export const LEAD_PIPELINE_STAGES = [
  'new',
  'assigned',
  'verifying',
  'verified',
  'with_astrologer',
  'remedies_ready',
  'sent_to_customer',
  'remedies_explained',
  'conversion',
  'closed',
] as const;

export type LeadPipelineStage = (typeof LEAD_PIPELINE_STAGES)[number];

/** Same labels everywhere — roles only choose which chips they see */
export const LEAD_PIPELINE_LABELS: Record<LeadPipelineStage, string> = {
  new: '1. New',
  assigned: '2. With Telecaller',
  verifying: '3. Verifying',
  verified: '4. Verified',
  with_astrologer: '5. With Astrologer',
  remedies_ready: '6. Remedies Ready',
  sent_to_customer: '7. Deliver Remedies',
  remedies_explained: '8. Explained Remedies',
  conversion: '9. Conversion',
  closed: '10. Closed',
};

export const LEAD_PIPELINE_HELP: Record<LeadPipelineStage, string> = {
  new: 'Manager assigns this lead to a telecaller',
  assigned: 'Telecaller calls the customer and checks form details',
  verifying: 'Telecaller is confirming or correcting details',
  verified: 'Telecaller done — manager forwards to an astrologer',
  with_astrologer: 'Astrologer writes remedies from the birth chart',
  remedies_ready: 'Manager reviews remedies, then sends to the same telecaller',
  sent_to_customer: 'Telecaller calls to explain remedies to the customer',
  remedies_explained: 'Remedies explained — moves to Conversion for sale outcome',
  conversion: 'Record Converted (order) or Not converted (reason), then close',
  closed: 'Lead closed (converted, not converted, fake, not interested, etc.)',
};

export const LEAD_STAGE_OWNER: Record<LeadPipelineStage, 'manager' | 'telecom' | 'astrologer' | 'done'> = {
  new: 'manager',
  assigned: 'telecom',
  verifying: 'telecom',
  verified: 'manager',
  with_astrologer: 'astrologer',
  remedies_ready: 'manager',
  sent_to_customer: 'telecom',
  remedies_explained: 'manager',
  conversion: 'telecom',
  closed: 'done',
};

/** Manager sees the full pipeline in order */
export const MANAGER_STAGE_FILTERS: LeadPipelineStage[] = [...LEAD_PIPELINE_STAGES];

/**
 * Telecaller chips — chronological pipeline order (not “active then waiting” scramble).
 */
export const TELECOM_STAGE_CHIPS: LeadPipelineStage[] = [
  'assigned',
  'verifying',
  'verified',
  'with_astrologer',
  'remedies_ready',
  'sent_to_customer',
  'remedies_explained',
  'conversion',
  'closed',
];

/** Telecaller active work (needs their call / action) */
export const TELECOM_ACTIVE_STAGES: LeadPipelineStage[] = [
  'assigned',
  'verifying',
  'sent_to_customer',
  'conversion',
];

/** Telecaller waiting on manager / astrologer (or ready for manager to close) */
export const TELECOM_WAITING_STAGES: LeadPipelineStage[] = [
  'verified',
  'with_astrologer',
  'remedies_ready',
  'remedies_explained',
];

/** Astrologer chips in order */
export const ASTRO_STAGE_CHIPS: LeadPipelineStage[] = [
  'with_astrologer',
  'remedies_ready',
  'sent_to_customer',
  'remedies_explained',
  'conversion',
  'closed',
];

export const ASTRO_ACTIVE_STAGES: LeadPipelineStage[] = ['with_astrologer', 'remedies_ready'];

export const LEAD_REMARK_CODES = [
  { code: 'details_confirmed', label: 'All Details are confirmed by the Customer / Payment received', terminal: false },
  { code: 'call_not_answering', label: 'Call Not Answering', terminal: false },
  { code: 'whatsapp_sent', label: 'WhatsApp Msg Sent', terminal: false },
  { code: 'not_interested', label: 'Not Interested', terminal: true },
  { code: 'fake_inquiry', label: 'Fake Inquiry', terminal: true },
  { code: 'call_disconnected', label: 'Call Disconnected', terminal: false },
  { code: 'language_issue', label: 'Language Issue', terminal: false },
  { code: 'btr_issue', label: '(BTR) Birth Time Rectification Issue', terminal: false },
  { code: 'call_back_later', label: 'Call Back Later', terminal: false },
  { code: 'email_sent', label: 'Email Sent', terminal: false },
  { code: 'contact_via_email', label: 'Will Contact via Email', terminal: false },
  { code: 'email_awaiting_reply', label: 'Email Sent — Awaiting Reply', terminal: false },
  { code: 'refused_to_pay', label: 'Refused to Pay', terminal: true },
  { code: 'remedies_explain', label: 'Remedies Explain', terminal: false },
  { code: 'option_sent', label: 'Option Sent', terminal: false },
  { code: 'payment_pending', label: '₹101/- Payment Pending', terminal: false },
  { code: 'budget_issue', label: 'Budget Issue', terminal: false },
  // ponytail: invalid number used to close the lead; keep open so telecaller can email
  { code: 'invalid_number', label: 'Invalid Number', terminal: false },
  { code: 'followup', label: 'Followup', terminal: false },
  { code: 'birthplace_issue', label: 'Birthplace Issue', terminal: false },
  { code: 'dissatisfied', label: 'Dissatisfied with remedies', terminal: false },
  { code: 'satisfied', label: 'Satisfied with Remedies', terminal: false },
  { code: 'custom', label: 'Custom Remark', terminal: false },
] as const;

export type LeadRemarkCode = (typeof LEAD_REMARK_CODES)[number]['code'];

export const LEAD_FOLLOWUP_CHANNELS = [
  { code: 'call' as const, label: 'Call' },
  { code: 'whatsapp' as const, label: 'WhatsApp' },
  { code: 'email' as const, label: 'Email' },
] as const;

export type LeadFollowUpChannel = (typeof LEAD_FOLLOWUP_CHANNELS)[number]['code'];

export const LEAD_FOLLOWUP_CHANNEL_LABEL: Record<LeadFollowUpChannel, string> = {
  call: 'Call',
  whatsapp: 'WhatsApp',
  email: 'Email',
};

/** Infer medium from remark code when telecaller uses a quick chip without picking channel. */
export function inferFollowUpChannel(code: LeadRemarkCode): LeadFollowUpChannel | null {
  if (code === 'whatsapp_sent') return 'whatsapp';
  if (code === 'email_sent' || code === 'email_awaiting_reply' || code === 'contact_via_email') return 'email';
  if (
    code === 'call_not_answering' ||
    code === 'call_disconnected' ||
    code === 'call_back_later' ||
    code === 'invalid_number' ||
    code === 'language_issue'
  ) {
    return 'call';
  }
  return null;
}

export const LEAD_REMARK_BY_CODE = Object.fromEntries(
  LEAD_REMARK_CODES.map((r) => [r.code, r])
) as Record<LeadRemarkCode, (typeof LEAD_REMARK_CODES)[number]>;

export const LEAD_ENQUIRY_TYPES = [
  'Remedies Recommendation',
  'Get a Call',
  'Enquiry',
  'Consultation',
  'Yagya',
  'Other',
] as const;

/** Contact-page / website message leads — no chart / remedies path */
export const CONTACT_STAGE_CHIPS: LeadPipelineStage[] = ['new', 'assigned', 'verifying', 'closed'];

export const CONTACT_TELECOM_STAGE_CHIPS: LeadPipelineStage[] = ['assigned', 'verifying', 'closed'];

/** Website “Send Us a Message” and plain Enquiry — telecaller contacts, then close */
export function isContactEnquiryLead(source?: string | null, enquiryType?: string | null) {
  if (source === 'contact_form') return true;
  const t = (enquiryType || '').toLowerCase();
  // ponytail: "consultation".includes("contact") is true — check enquiry / contact enquir only
  return t === 'enquiry' || t.includes('contact enquir');
}

export const TELECOM_EDITABLE_STAGES: LeadPipelineStage[] = [
  'assigned',
  'verifying',
  'sent_to_customer',
  'remedies_explained',
  'conversion',
  'closed',
];

export const TELECOM_CALL_OUTCOMES = [
  { code: 'call_not_answering' as const, short: 'Not answering', hint: 'No pickup — try again later' },
  { code: 'call_disconnected' as const, short: 'Disconnected', hint: 'Call dropped mid-way' },
  { code: 'call_back_later' as const, short: 'Callback requested', hint: 'Customer asked to call back' },
  { code: 'language_issue' as const, short: 'Language issue', hint: 'Need different language' },
  { code: 'invalid_number' as const, short: 'Invalid number', hint: 'Number wrong — lead stays open; use email options below' },
  { code: 'contact_via_email' as const, short: 'Will contact via email', hint: 'Phone unusable — will reach out on email' },
  { code: 'email_sent' as const, short: 'Email sent', hint: 'Verification / follow-up email sent' },
  { code: 'email_awaiting_reply' as const, short: 'Awaiting email reply', hint: 'Email sent — waiting for customer reply' },
  { code: 'not_interested' as const, short: 'Not interested', hint: 'Closes the lead — manager notified' },
  { code: 'fake_inquiry' as const, short: 'Fake enquiry', hint: 'Closes the lead — manager notified' },
  { code: 'custom' as const, short: 'Custom remark', hint: 'Type your note below, then tap this to save' },
] as const;

export const TELECOM_DELIVERY_OUTCOMES = [
  { code: 'call_not_answering' as const, short: 'Not answering', hint: 'No pickup — try again later' },
  { code: 'call_disconnected' as const, short: 'Disconnected', hint: 'Call dropped mid-way' },
  { code: 'call_back_later' as const, short: 'Callback requested', hint: 'Customer asked to call back' },
  { code: 'language_issue' as const, short: 'Language issue', hint: 'Need different language' },
  { code: 'invalid_number' as const, short: 'Invalid number', hint: 'Number wrong — lead stays open; use email options below' },
  { code: 'contact_via_email' as const, short: 'Will contact via email', hint: 'Phone unusable — will explain remedies over email' },
  { code: 'email_sent' as const, short: 'Email sent', hint: 'Remedies / follow-up emailed to customer' },
  { code: 'email_awaiting_reply' as const, short: 'Awaiting email reply', hint: 'Email sent — waiting for customer reply' },
  { code: 'remedies_explain' as const, short: 'Remedies explained', hint: 'Moves lead to Conversion — record sale outcome next' },
  { code: 'option_sent' as const, short: 'Option sent', hint: 'Product / remedy options shared' },
  { code: 'satisfied' as const, short: 'Satisfied', hint: 'Customer happy — moves to Conversion for sale outcome' },
  { code: 'dissatisfied' as const, short: 'Dissatisfied', hint: 'Customer unhappy — try again later' },
  { code: 'followup' as const, short: 'Follow-up needed', hint: 'Schedule another call (use follow-up date)' },
  { code: 'not_interested' as const, short: 'Not interested', hint: 'Closes the lead — manager notified' },
  { code: 'custom' as const, short: 'Custom remark', hint: 'Type your note below, then tap this to save' },
] as const;

export const ASTROLOGER_EDITABLE_STAGES: LeadPipelineStage[] = ['with_astrologer', 'remedies_ready'];

/** Post-explained: why the customer did not buy */
export const LEAD_NOT_CONVERTED_REASONS = [
  { code: 'budget_issue' as const, label: 'Budget issue' },
  { code: 'timing_issue' as const, label: 'Timing / later' },
  { code: 'wants_to_think' as const, label: 'Wants to think' },
  { code: 'dissatisfied' as const, label: 'Dissatisfied with remedies' },
  { code: 'other' as const, label: 'Other (write reason)' },
] as const;

export type LeadNotConvertedReason = (typeof LEAD_NOT_CONVERTED_REASONS)[number]['code'];

export const LEAD_NOT_CONVERTED_BY_CODE = Object.fromEntries(
  LEAD_NOT_CONVERTED_REASONS.map((r) => [r.code, r])
) as Record<LeadNotConvertedReason, (typeof LEAD_NOT_CONVERTED_REASONS)[number]>;

export function isLeadNotConvertedReason(value: string): value is LeadNotConvertedReason {
  return value in LEAD_NOT_CONVERTED_BY_CODE;
}

export type LeadConversionStatus = 'converted' | 'not_converted';

export const REMEDIES_TEMPLATE = `*Remedies Recommended:*
|| Horoscope Analysis ||

Ascendant:-
Moon Sign:-

Gemstone Recommendation:-


Rudraksha Recommendation:-


Vimshottari Dasha:- Current Dashas Going on >

Prediction:-


Forward to Customer Date: `;

export function isLeadPipelineStage(value: string): value is LeadPipelineStage {
  return (LEAD_PIPELINE_STAGES as readonly string[]).includes(value);
}

export function isLeadRemarkCode(value: string): value is LeadRemarkCode {
  return value in LEAD_REMARK_BY_CODE;
}

const FORWARD: Record<LeadPipelineStage, LeadPipelineStage[]> = {
  new: ['assigned', 'closed'],
  assigned: ['verifying', 'verified', 'closed'],
  verifying: ['verified', 'assigned', 'closed'],
  verified: ['with_astrologer', 'verifying', 'closed'],
  with_astrologer: ['remedies_ready', 'verified', 'closed'],
  remedies_ready: ['sent_to_customer', 'with_astrologer', 'closed'],
  sent_to_customer: ['remedies_explained', 'conversion', 'closed'],
  remedies_explained: ['conversion', 'sent_to_customer', 'closed'],
  conversion: ['closed', 'sent_to_customer'],
  closed: ['assigned', 'verifying', 'sent_to_customer', 'conversion'],
};

export function canTransitionPipeline(from: string, to: string): boolean {
  if (from === to) return true;
  if (!isLeadPipelineStage(from) || !isLeadPipelineStage(to)) return false;
  return FORWARD[from].includes(to);
}

export function assertLeadConstants() {
  if (LEAD_REMARK_CODES.length !== 23) throw new Error('expected 23 remark codes');
  if (!canTransitionPipeline('new', 'assigned')) throw new Error('new→assigned');
  if (!canTransitionPipeline('verified', 'with_astrologer')) throw new Error('verified→astrologer');
  if (!canTransitionPipeline('with_astrologer', 'remedies_ready')) throw new Error('astro→remedies');
  if (!canTransitionPipeline('remedies_ready', 'sent_to_customer')) throw new Error('remedies→delivery');
  if (!canTransitionPipeline('sent_to_customer', 'remedies_explained')) throw new Error('deliver→explained');
  if (!canTransitionPipeline('remedies_explained', 'conversion')) throw new Error('explained→conversion');
  if (!canTransitionPipeline('conversion', 'closed')) throw new Error('conversion→closed');
  if (canTransitionPipeline('new', 'with_astrologer')) throw new Error('new must not skip to astrologer');
  if (canTransitionPipeline('assigned', 'with_astrologer')) throw new Error('telecom must verify first');
  if (!LEAD_REMARK_BY_CODE.fake_inquiry.terminal) throw new Error('fake should be terminal');
  if (LEAD_REMARK_BY_CODE.invalid_number.terminal) throw new Error('invalid_number must not close lead');
  if (LEAD_NOT_CONVERTED_REASONS.length !== 5) throw new Error('expected 5 not-converted reasons');
  if (!isLeadNotConvertedReason('budget_issue')) throw new Error('budget_issue reason');
  if (!isLeadNotConvertedReason('other')) throw new Error('other reason');
  if (LEAD_PIPELINE_LABELS.conversion !== '9. Conversion') throw new Error('conversion label');
  if (LEAD_PIPELINE_LABELS.closed !== '10. Closed') throw new Error('closed is step 10');
  if (!isContactEnquiryLead('contact_form', null)) throw new Error('contact_form is contact lead');
  if (!isContactEnquiryLead(null, 'Enquiry')) throw new Error('Enquiry type is contact lead');
  if (!isContactEnquiryLead(null, 'Contact enquiry')) throw new Error('Contact enquiry type');
  if (isContactEnquiryLead(null, 'Consultation')) throw new Error('Consultation must not be contact lead');
  if (isContactEnquiryLead('homepage_recommendation', 'Remedies Recommendation')) {
    throw new Error('remedies must not be contact lead');
  }
  if (!canTransitionPipeline('assigned', 'closed')) throw new Error('contact path assigned→closed');
}
