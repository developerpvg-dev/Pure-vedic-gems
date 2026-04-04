import { z } from 'zod';

// ─── Phone regex — Indian mobiles (+91 prefix optional) ─────────────────────
const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;

// ─── Indian pincode (6-digit) ───────────────────────────────────────────────
const PINCODE_REGEX = /^[1-9]\d{5}$/;

// ─── Contact Information ────────────────────────────────────────────────────
export const ContactInfoSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name is too long')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  phone: z
    .string()
    .regex(PHONE_REGEX, 'Please enter a valid phone number'),
});

// ─── Shipping Address ───────────────────────────────────────────────────────
export const ShippingAddressSchema = z.object({
  line1: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address is too long')
    .trim(),
  line2: z
    .string()
    .max(500)
    .trim()
    .optional()
    .default(''),
  city: z
    .string()
    .min(2, 'City is required')
    .max(100)
    .trim(),
  state: z
    .string()
    .min(2, 'State is required')
    .max(100)
    .trim(),
  pincode: z
    .string()
    .regex(PINCODE_REGEX, 'Please enter a valid 6-digit Indian pincode'),
  country: z
    .string()
    .trim()
    .default('India'),
});

// ─── Cart Item (for order creation) ─────────────────────────────────────────
export const OrderItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  name: z.string().min(1),
  sku: z.string().optional(),
  quantity: z.number().int().min(1).max(10),
  price: z.number().min(0), // client-sent price (will be re-verified server-side)
  carat_weight: z.number().nullable().optional(),
  origin: z.string().nullable().optional(),
  image_url: z.string().optional(),
  category: z.string().optional(),
  configuration_id: z.string().uuid().optional(),
  configuration_summary: z.string().optional(),
});

// ─── Energization / Puja fields ─────────────────────────────────────────────
export const EnergizationFieldsSchema = z.object({
  include_energization: z.boolean().default(false),
  energization_type: z.string().optional(),
  ceremony_dob: z.string().optional(),
  ceremony_gotra: z.string().max(100).optional(),
  ceremony_rashi: z.string().max(50).optional(),
  record_ceremony: z.boolean().default(false),
});

// ─── Shipping methods ───────────────────────────────────────────────────────
export const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard Delivery (5-7 days)', cost: 0 },
  { id: 'express', label: 'Express Delivery (2-3 days)', cost: 250 },
  { id: 'same_day', label: 'Same Day (Delhi NCR only)', cost: 500 },
] as const;

export type ShippingMethodId = (typeof SHIPPING_METHODS)[number]['id'];

// ─── Full Order Creation Request ────────────────────────────────────────────
export const OrderCreateSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'Cart is empty'),
  contact: ContactInfoSchema,
  shipping_address: ShippingAddressSchema,
  shipping_method: z
    .enum(['standard', 'express', 'same_day'])
    .default('standard'),
  energization: EnergizationFieldsSchema.optional(),
  special_instructions: z.string().max(1000).trim().optional(),
  coupon_code: z.string().max(50).trim().optional(),
});

// ─── Payment Verification ───────────────────────────────────────────────────
export const PaymentVerifySchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
  order_id: z.string().uuid('Invalid order ID'),
});

// ─── Payment Create Order ───────────────────────────────────────────────────
export const PaymentCreateOrderSchema = z.object({
  order_id: z.string().uuid('Invalid order ID'),
});

// ─── Type exports ───────────────────────────────────────────────────────────
export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type EnergizationFields = z.infer<typeof EnergizationFieldsSchema>;
export type OrderCreate = z.infer<typeof OrderCreateSchema>;
export type PaymentVerify = z.infer<typeof PaymentVerifySchema>;
export type PaymentCreateOrder = z.infer<typeof PaymentCreateOrderSchema>;
