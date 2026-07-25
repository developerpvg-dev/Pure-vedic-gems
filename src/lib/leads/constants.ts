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
  closed: '9. Closed',
};

export const LEAD_PIPELINE_HELP: Record<LeadPipelineStage, string> = {
  new: 'Manager assigns this lead to a telecaller',
  assigned: 'Telecaller calls the customer and checks form details',
  verifying: 'Telecaller is confirming or correcting details',
  verified: 'Telecaller done — manager forwards to an astrologer',
  with_astrologer: 'Astrologer writes remedies from the birth chart',
  remedies_ready: 'Manager reviews remedies, then sends to the same telecaller',
  sent_to_customer: 'Telecaller calls to explain remedies to the customer',
  remedies_explained: 'Remedies explained — manager can close the lead',
  closed: 'Lead closed (done, fake, not interested, etc.)',
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
  'closed',
];

/** Telecaller active work (needs their call / action) */
export const TELECOM_ACTIVE_STAGES: LeadPipelineStage[] = [
  'assigned',
  'verifying',
  'sent_to_customer',
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
  { code: 'refused_to_pay', label: 'Refused to Pay', terminal: true },
  { code: 'remedies_explain', label: 'Remedies Explain', terminal: false },
  { code: 'option_sent', label: 'Option Sent', terminal: false },
  { code: 'payment_pending', label: '₹101/- Payment Pending', terminal: false },
  { code: 'budget_issue', label: 'Budget Issue', terminal: false },
  { code: 'invalid_number', label: 'Invalid Number', terminal: true },
  { code: 'followup', label: 'Followup', terminal: false },
  { code: 'birthplace_issue', label: 'Birthplace Issue', terminal: false },
  { code: 'dissatisfied', label: 'Dissatisfied with remedies', terminal: false },
  { code: 'satisfied', label: 'Satisfied with Remedies', terminal: false },
  { code: 'custom', label: 'Customized Column', terminal: false },
] as const;

export type LeadRemarkCode = (typeof LEAD_REMARK_CODES)[number]['code'];

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

export const TELECOM_EDITABLE_STAGES: LeadPipelineStage[] = [
  'assigned',
  'verifying',
  'sent_to_customer',
  'remedies_explained',
  'closed',
];

export const TELECOM_CALL_OUTCOMES = [
  { code: 'call_not_answering' as const, short: 'Not answering', hint: 'No pickup — try again later' },
  { code: 'call_disconnected' as const, short: 'Disconnected', hint: 'Call dropped mid-way' },
  { code: 'call_back_later' as const, short: 'Callback requested', hint: 'Customer asked to call back' },
  { code: 'language_issue' as const, short: 'Language issue', hint: 'Need different language' },
  { code: 'not_interested' as const, short: 'Not interested', hint: 'Closes the lead — manager notified' },
  { code: 'fake_inquiry' as const, short: 'Fake enquiry', hint: 'Closes the lead — manager notified' },
  { code: 'invalid_number' as const, short: 'Invalid number', hint: 'Closes the lead — manager notified' },
] as const;

export const TELECOM_DELIVERY_OUTCOMES = [
  { code: 'call_not_answering' as const, short: 'Not answering', hint: 'No pickup — try again later' },
  { code: 'call_disconnected' as const, short: 'Disconnected', hint: 'Call dropped mid-way' },
  { code: 'call_back_later' as const, short: 'Callback requested', hint: 'Customer asked to call back' },
  { code: 'language_issue' as const, short: 'Language issue', hint: 'Need different language' },
  { code: 'remedies_explain' as const, short: 'Remedies explained', hint: 'Moves lead to Explained — manager can close' },
  { code: 'option_sent' as const, short: 'Option sent', hint: 'Product / remedy options shared' },
  { code: 'satisfied' as const, short: 'Satisfied', hint: 'Customer happy — marks Explained for manager' },
  { code: 'dissatisfied' as const, short: 'Dissatisfied', hint: 'Customer unhappy — try again later' },
  { code: 'followup' as const, short: 'Follow-up needed', hint: 'Schedule another call (use follow-up date)' },
  { code: 'not_interested' as const, short: 'Not interested', hint: 'Closes the lead — manager notified' },
  { code: 'invalid_number' as const, short: 'Invalid number', hint: 'Closes the lead — manager notified' },
] as const;

export const ASTROLOGER_EDITABLE_STAGES: LeadPipelineStage[] = ['with_astrologer', 'remedies_ready'];

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
  sent_to_customer: ['remedies_explained', 'closed'],
  remedies_explained: ['closed', 'sent_to_customer'],
  closed: ['assigned', 'verifying', 'sent_to_customer'],
};

export function canTransitionPipeline(from: string, to: string): boolean {
  if (from === to) return true;
  if (!isLeadPipelineStage(from) || !isLeadPipelineStage(to)) return false;
  return FORWARD[from].includes(to);
}

export function assertLeadConstants() {
  if (LEAD_REMARK_CODES.length !== 21) throw new Error('expected 21 remark codes');
  if (!canTransitionPipeline('new', 'assigned')) throw new Error('new→assigned');
  if (!canTransitionPipeline('verified', 'with_astrologer')) throw new Error('verified→astrologer');
  if (!canTransitionPipeline('with_astrologer', 'remedies_ready')) throw new Error('astro→remedies');
  if (!canTransitionPipeline('remedies_ready', 'sent_to_customer')) throw new Error('remedies→delivery');
  if (!canTransitionPipeline('sent_to_customer', 'remedies_explained')) throw new Error('deliver→explained');
  if (!canTransitionPipeline('remedies_explained', 'closed')) throw new Error('explained→closed');
  if (canTransitionPipeline('new', 'with_astrologer')) throw new Error('new must not skip to astrologer');
  if (canTransitionPipeline('assigned', 'with_astrologer')) throw new Error('telecom must verify first');
  if (!LEAD_REMARK_BY_CODE.fake_inquiry.terminal) throw new Error('fake should be terminal');
}
