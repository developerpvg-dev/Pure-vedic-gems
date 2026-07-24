/** Lead CRM — clear pipeline matching ops flow */

export const LEAD_PIPELINE_STAGES = [
  'new',
  'assigned',
  'verifying',
  'verified',
  'with_astrologer',
  'remedies_ready',
  'sent_to_customer', // delivery: telecaller contacts customer with final remedies
  'follow_up',
  'closed',
] as const;

export type LeadPipelineStage = (typeof LEAD_PIPELINE_STAGES)[number];

export const LEAD_PIPELINE_LABELS: Record<LeadPipelineStage, string> = {
  new: '1. New',
  assigned: '2. With Telecaller',
  verifying: '3. Verifying',
  verified: '4. Verified',
  with_astrologer: '5. With Astrologer',
  remedies_ready: '6. Remedies Ready',
  sent_to_customer: '7. Deliver Remedies',
  follow_up: '8. Follow-up',
  closed: 'Closed',
};

export const LEAD_PIPELINE_HELP: Record<LeadPipelineStage, string> = {
  new: 'Leads manager assigns this to a telecaller',
  assigned: 'Telecaller calls & checks customer details',
  verifying: 'Telecaller is confirming / editing details',
  verified: 'Details OK — leads manager can forward to astrologer',
  with_astrologer: 'Astrologer analyses chart & writes remedies',
  remedies_ready: 'Leads manager reviews / edits remedies, then sends to telecaller',
  sent_to_customer: 'Telecaller delivers remedies & updates remarks',
  follow_up: 'Ongoing follow-up after remedies shared',
  closed: 'Enquiry closed (sold, fake, not interested, etc.)',
};

/** Who owns the next action at each stage */
export const LEAD_STAGE_OWNER: Record<LeadPipelineStage, 'manager' | 'telecom' | 'astrologer' | 'done'> = {
  new: 'manager',
  assigned: 'telecom',
  verifying: 'telecom',
  verified: 'manager',
  with_astrologer: 'astrologer',
  remedies_ready: 'manager',
  sent_to_customer: 'telecom',
  follow_up: 'telecom',
  closed: 'done',
};

/** Canonical remark codes from ops sheet (1–21) */
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

/** Telecaller may move among these stages */
export const TELECOM_EDITABLE_STAGES: LeadPipelineStage[] = [
  'assigned',
  'verifying',
  'verified',
  'sent_to_customer',
  'follow_up',
  'closed',
];

/** Astrologer only works while assigned remedies */
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

/**
 * Strict forward transitions — matches:
 * manager assign → telecom verify → manager → astrologer → manager edit → telecom deliver
 */
const FORWARD: Record<LeadPipelineStage, LeadPipelineStage[]> = {
  new: ['assigned', 'closed'],
  assigned: ['verifying', 'verified', 'closed'],
  verifying: ['verified', 'assigned', 'follow_up', 'closed'],
  verified: ['with_astrologer', 'verifying', 'closed'],
  with_astrologer: ['remedies_ready', 'verified', 'closed'],
  remedies_ready: ['sent_to_customer', 'with_astrologer', 'closed'],
  sent_to_customer: ['follow_up', 'closed'],
  follow_up: ['sent_to_customer', 'closed'],
  closed: ['assigned', 'follow_up'],
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
  if (canTransitionPipeline('new', 'with_astrologer')) throw new Error('new must not skip to astrologer');
  if (canTransitionPipeline('assigned', 'with_astrologer')) throw new Error('telecom must verify first');
  if (!LEAD_REMARK_BY_CODE.fake_inquiry.terminal) throw new Error('fake should be terminal');
}
