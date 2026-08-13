import { z } from 'zod';
import { LEAD_PIPELINE_STAGES, LEAD_REMARK_CODES } from '@/lib/leads/constants';

export const enquiryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
  email: z.string().email('Invalid email').max(255).trim(),
  phone: z.string().max(20).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1, 'Message is required').max(5000).trim(),
  product_id: z.string().uuid().optional(),
  source: z.string().max(50).default('contact_form'),
  enquiry_type: z.string().max(120).optional(),
  date_of_birth: z.string().max(40).optional(),
  birth_time: z.string().max(40).optional(),
  birth_place: z.string().max(180).optional(),
  area_of_concern: z.string().max(180).optional(),
  ip_location: z.string().max(160).optional(),
});

export type EnquiryCreateInput = z.infer<typeof enquiryCreateSchema>;

const remarkCodeEnum = z.enum(
  LEAD_REMARK_CODES.map((r) => r.code) as [string, ...string[]]
);

export const enquiryUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'resolved', 'closed']).optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  follow_up_date: z.string().optional().nullable(),
  internal_notes: z.string().max(5000).optional().nullable(),
  pipeline_stage: z.enum(LEAD_PIPELINE_STAGES).optional(),
  enquiry_type: z.string().max(120).optional().nullable(),
  ip_location: z.string().max(160).optional().nullable(),
  date_of_birth: z.string().max(40).optional().nullable(),
  birth_time: z.string().max(40).optional().nullable(),
  birth_place: z.string().max(180).optional().nullable(),
  customer_city: z.string().max(120).optional().nullable(),
  customer_state: z.string().max(120).optional().nullable(),
  customer_country: z.string().max(120).optional().nullable(),
  area_of_concern: z.string().max(180).optional().nullable(),
  details_confirmed: z.boolean().optional(),
  payment_received: z.boolean().optional(),
  payment_note: z.string().max(2000).optional().nullable(),
  astrologer_id: z.string().uuid().optional().nullable(),
  astrologer_name: z.string().max(200).optional().nullable(),
  remedies_text: z.string().max(50000).optional().nullable(),
  astrologer_help: z.boolean().optional().nullable(),
  product_purchase: z.boolean().optional().nullable(),
  sale_close: z.boolean().optional().nullable(),
  feedback_received: z.boolean().optional().nullable(),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(40).optional().nullable(),
  additional_phones: z.array(z.string().max(40)).max(10).optional(),
  additional_emails: z.array(z.string().max(255)).max(10).optional(),
});

export type EnquiryUpdateInput = z.infer<typeof enquiryUpdateSchema>;

export const leadRemarkCreateSchema = z.object({
  code: remarkCodeEnum,
  note: z.string().max(5000).optional().nullable(),
  channel: z.enum(['call', 'whatsapp', 'email']).optional().nullable(),
  /** ISO or local datetime string — when the follow-up actually happened */
  occurred_at: z.string().max(40).optional().nullable(),
  /** Optional next callback date (YYYY-MM-DD) stored on the enquiry */
  follow_up_date: z.string().max(40).optional().nullable(),
});

export type LeadRemarkCreateInput = z.infer<typeof leadRemarkCreateSchema>;
