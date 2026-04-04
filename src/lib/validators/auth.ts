import { z } from 'zod';

// Phone regex — accepts +91... or plain 10-digit Indian numbers
const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;

// ── Register ─────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long'),
  phone: z
    .string()
    .regex(PHONE_REGEX, 'Enter a valid phone number (e.g. +91 98765 43210)')
    .optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

// ── Login — discriminated union for 3 flows ──────────────────────────────────

export const LoginSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('email'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
  z.object({
    type: z.literal('otp_request'),
    phone: z
      .string()
      .regex(PHONE_REGEX, 'Enter a valid phone number'),
  }),
  z.object({
    type: z.literal('magic_link'),
    email: z.string().email('Invalid email address'),
  }),
]);

export type LoginInput = z.infer<typeof LoginSchema>;

// ── OTP Verification ─────────────────────────────────────────────────────────

export const OTPSchema = z.object({
  phone: z.string().regex(PHONE_REGEX, 'Enter a valid phone number'),
  token: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export type OTPInput = z.infer<typeof OTPSchema>;

// ── Profile update ───────────────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).trim().optional(),
  phone: z
    .string()
    .regex(PHONE_REGEX, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  whatsapp: z
    .string()
    .regex(PHONE_REGEX, 'Enter a valid WhatsApp number')
    .optional()
    .or(z.literal('')),
  date_of_birth: z.string().optional(),
  birth_time: z.string().optional(),
  birth_place: z.string().max(200).optional(),
  gotra: z.string().max(100).optional(),
  rashi: z.string().max(50).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
