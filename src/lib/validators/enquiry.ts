import { z } from 'zod';

export const enquiryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
  email: z.string().email('Invalid email').max(255).trim(),
  phone: z.string().max(20).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1, 'Message is required').max(5000).trim(),
  product_id: z.string().uuid().optional(),
  source: z.string().max(50).default('contact_form'),
});

export type EnquiryCreateInput = z.infer<typeof enquiryCreateSchema>;

export const enquiryUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'resolved', 'closed']).optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  follow_up_date: z.string().optional().nullable(),
  internal_notes: z.string().max(5000).optional().nullable(),
});

export type EnquiryUpdateInput = z.infer<typeof enquiryUpdateSchema>;
