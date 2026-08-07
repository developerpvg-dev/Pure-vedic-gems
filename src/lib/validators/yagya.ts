import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const yagyaCreateSchema = z.object({
  sku: z.string().trim().min(1).max(30),
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200).regex(slugRegex, 'Slug must be lowercase words separated by hyphens'),
  price: z.coerce.number().min(0),
  short_desc: z.string().trim().max(500).nullish(),
  description: z.string().trim().nullish(),
  benefits: z.array(z.string().trim().min(1)).max(20).default([]),
  images: z.array(z.string().url()).max(10).default([]),
  thumbnail_url: z.string().url().nullish(),
  planet: z.string().trim().max(50).nullish(),
  service_duration: z.string().trim().max(120).nullish(),
  service_delivery_mode: z.string().trim().max(80).nullish(),
  display_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const yagyaUpdateSchema = yagyaCreateSchema.partial();

export type YagyaCreateInput = z.infer<typeof yagyaCreateSchema>;
export type YagyaUpdateInput = z.infer<typeof yagyaUpdateSchema>;

// ---------------------------------------------------------------------------
// Yagya purchase / booking (paid via Razorpay)
// ---------------------------------------------------------------------------

const optionalIsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
  .optional();

const optionalTime = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Invalid time')
  .optional();

const optionalTrimmedText = (max: number) => z.string().max(max).trim().optional();

const optionalNullableIsoDate = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date').nullable().optional()
);

const optionalNullableText = (max: number) =>
  z.preprocess(
    (value) => (value === '' ? null : value),
    z.string().max(max).trim().nullable().optional()
  );

export const yagyaBookingCreateOrderSchema = z.object({
  yagya_id: z.string().uuid(),
  full_name: z.string().min(1, 'Name is required').max(200).trim(),
  email: z.string().email('Invalid email').max(255).trim(),
  phone: z.string().regex(/^[0-9+\-\s()]{7,20}$/, 'Invalid phone').trim(),
  sankalp_name: optionalTrimmedText(200),
  gotra: optionalTrimmedText(120),
  rashi: optionalTrimmedText(80),
  nakshatra: optionalTrimmedText(80),
  date_of_birth: optionalIsoDate.refine(
    (value) => !value || new Date(`${value}T00:00:00`) <= new Date(),
    'Date of birth cannot be in the future'
  ),
  birth_time: optionalTime,
  birth_place: optionalTrimmedText(200),
  preferred_date: optionalIsoDate.refine((value) => {
    if (!value) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${value}T00:00:00`) >= today;
  }, 'Preferred date cannot be in the past'),
  message: optionalTrimmedText(5000),
  website: z.string().max(0).optional(),
  /** Storefront currency for the Razorpay charge (ledger amount_inr stays INR). */
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .optional(),
});

export type YagyaBookingCreateOrderInput = z.infer<typeof yagyaBookingCreateOrderSchema>;

export const yagyaPaymentVerifySchema = z.object({
  booking_id: z.string().uuid(),
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().min(20).max(500),
});

export type YagyaPaymentVerifyInput = z.infer<typeof yagyaPaymentVerifySchema>;

export const yagyaBookingUpdateSchema = z
  .object({
    status: z
      .enum(['pending_payment', 'confirmed', 'scheduled', 'performed', 'completed', 'cancelled', 'payment_review'])
      .optional(),
    scheduled_date: optionalNullableIsoDate,
    muhurat_note: optionalNullableText(2000),
    recording_link: optionalNullableText(1000),
    admin_notes: optionalNullableText(5000),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export type YagyaBookingUpdateInput = z.infer<typeof yagyaBookingUpdateSchema>;
