import { z } from 'zod';

const optionalIsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
  .optional();

const optionalTime = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Invalid time')
  .optional();

const optionalTrimmedText = (max: number) =>
  z
    .string()
    .max(max)
    .trim()
    .optional();

export const consultationCreateSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(200).trim(),
  email: z.string().email('Invalid email').max(255).trim(),
  phone: z.string().regex(/^[0-9+\-\s()]{7,20}$/, 'Invalid phone').trim(),
  date_of_birth: optionalIsoDate.refine((value) => !value || new Date(`${value}T00:00:00`) <= new Date(), 'Date of birth cannot be in the future'),
  birth_time: optionalTime,
  birth_place: z.string().max(200).optional(),
  life_situation: z.string().max(5000).optional(),
  consultation_type: z.enum(['gemstone', 'kundali', 'vastu', 'general']),
  mode: z.enum(['video', 'phone', 'in_person', 'whatsapp']),
  preferred_date: optionalIsoDate.refine((value) => {
    if (!value) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${value}T00:00:00`) >= today;
  }, 'Preferred date cannot be in the past'),
  preferred_time: optionalTime,
  expert_id: z.string().uuid().optional(),
  message: z.string().max(5000).optional(),
  website: z.string().max(0).optional(),
});

export type ConsultationCreateInput = z.infer<typeof consultationCreateSchema>;

export const consultationUpdateSchema = z.object({
  status: z.enum(['pending_payment', 'pending', 'confirmed', 'completed', 'cancelled', 'payment_review']).optional(),
  assigned_expert: z.string().uuid().optional().nullable(),
  internal_notes: z.string().max(5000).optional().nullable(),
});

export type ConsultationUpdateInput = z.infer<typeof consultationUpdateSchema>;

export const consultationPlanSchema = z.object({
  title: z.string().min(3, 'Title is required').max(240).trim(),
  slug: z
    .string()
    .min(3)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens')
    .trim(),
  description: z.string().max(5000).trim().optional().nullable(),
  amount_inr: z.coerce.number().min(1, 'INR price is required').max(1_000_000),
  amount_usd: z.coerce.number().min(0).max(100_000).optional().nullable(),
  currency: z.string().length(3).default('INR'),
  duration_minutes: z.coerce.number().int().min(1).max(600).optional().nullable(),
  is_active: z.coerce.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).max(10_000).default(0),
});

export const consultationPlanUpdateSchema = consultationPlanSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required'
);

export type ConsultationPlanInput = z.infer<typeof consultationPlanSchema>;
export type ConsultationPlanUpdateInput = z.infer<typeof consultationPlanUpdateSchema>;

export const consultationBookingCreateOrderSchema = z.object({
  plan_id: z.string().uuid(),
  full_name: z.string().min(1, 'Name is required').max(200).trim(),
  email: z.string().email('Invalid email').max(255).trim(),
  phone: z.string().regex(/^[0-9+\-\s()]{7,20}$/, 'Invalid phone').trim(),
  date_of_birth: optionalIsoDate.refine((value) => !value || new Date(`${value}T00:00:00`) <= new Date(), 'Date of birth cannot be in the future'),
  birth_time: optionalTime,
  birth_place: optionalTrimmedText(200),
  life_situation: optionalTrimmedText(5000),
  preferred_date: optionalIsoDate.refine((value) => {
    if (!value) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${value}T00:00:00`) >= today;
  }, 'Preferred date cannot be in the past'),
  preferred_time: optionalTime,
  message: optionalTrimmedText(5000),
  website: z.string().max(0).optional(),
});

export type ConsultationBookingCreateOrderInput = z.infer<typeof consultationBookingCreateOrderSchema>;

export const consultationPaymentVerifySchema = z.object({
  consultation_id: z.string().uuid(),
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().min(20).max(500),
});

export type ConsultationPaymentVerifyInput = z.infer<typeof consultationPaymentVerifySchema>;
