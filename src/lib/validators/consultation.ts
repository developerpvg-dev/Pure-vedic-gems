import { z } from 'zod';

const optionalIsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
  .optional();

const optionalTime = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Invalid time')
  .optional();

const optionalNullableIsoDate = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date').nullable().optional()
);

const optionalNullableTime = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time').nullable().optional()
);

const optionalNullableUpdateText = (max: number) =>
  z.preprocess(
    (value) => (value === '' ? null : value),
    z.string().max(max).trim().nullable().optional()
  );

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
  scheduled_date: optionalNullableIsoDate,
  scheduled_time: optionalNullableTime,
  scheduled_mode: optionalNullableUpdateText(80),
  meeting_link: optionalNullableUpdateText(1000),
  admin_schedule_notes: optionalNullableUpdateText(5000),
});

export type ConsultationUpdateInput = z.infer<typeof consultationUpdateSchema>;

const optionalNullableText = (max: number) =>
  z.preprocess(
    (value) => (value === '' ? null : value),
    z.string().max(max).trim().nullable().optional()
  );

const optionalNullableNumber = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === '' ? null : value),
    z.coerce.number().min(min).max(max).nullable().optional()
  );

const optionalNullableInteger = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === '' ? null : value),
    z.coerce.number().int().min(min).max(max).nullable().optional()
  );

const consultationPlanMetadataSchema = z
  .object({
    card_color: z.enum(['amber', 'violet', 'emerald', 'blue', 'orange', 'rose']).optional(),
    image_url: z
      .string()
      .trim()
      .max(1000)
      .refine(
        (value) => !value || value.startsWith('/') || /^https?:\/\//i.test(value),
        'Use a valid public image URL or site path'
      )
      .nullable()
      .optional(),
    badge_label: optionalNullableText(48),
    mode_label: optionalNullableText(80),
    details: optionalNullableText(10000),
    highlights: z.array(z.string().trim().min(1).max(140)).max(10).optional(),
  })
  .passthrough();

const consultationPlanBaseShape = {
  title: z.string().min(3, 'Title is required').max(240).trim(),
  slug: z
    .string()
    .min(3)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens')
    .trim(),
  description: optionalNullableText(5000),
  amount_inr: z.coerce.number().min(1, 'INR price is required').max(1_000_000),
  amount_usd: optionalNullableNumber(0, 100_000),
  currency: z.string().length(3).default('INR'),
  duration_minutes: optionalNullableInteger(1, 600),
  is_active: z.coerce.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).max(10_000).default(0),
  metadata: consultationPlanMetadataSchema.default({}),
};

export const consultationPlanSchema = z.object(consultationPlanBaseShape);

export const consultationPlanUpdateSchema = z
  .object({
    title: consultationPlanBaseShape.title.optional(),
    slug: consultationPlanBaseShape.slug.optional(),
    description: consultationPlanBaseShape.description,
    amount_inr: consultationPlanBaseShape.amount_inr.optional(),
    amount_usd: consultationPlanBaseShape.amount_usd,
    currency: z.string().length(3).optional(),
    duration_minutes: consultationPlanBaseShape.duration_minutes,
    is_active: z.coerce.boolean().optional(),
    sort_order: z.coerce.number().int().min(0).max(10_000).optional(),
    metadata: consultationPlanMetadataSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

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
