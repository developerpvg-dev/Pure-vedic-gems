import { z } from 'zod';

// ─── Phone regex — Indian mobiles (+91 prefix optional) ─────────────────────
const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

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
  business_name: z
    .string()
    .trim()
    .max(220, 'Business name is too long')
    .optional()
    .default(''),
  billing_gstin: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .default('')
    .refine((value) => !value || GSTIN_REGEX.test(value), 'Please enter a valid GSTIN'),
});

export const CheckoutConsentSchema = z.object({
  terms_accepted: z.literal(true, { error: 'Terms must be accepted' }),
  privacy_accepted: z.literal(true, { error: 'Privacy policy must be accepted' }),
  return_policy_accepted: z.literal(true, { error: 'Return policy must be accepted' }),
  marketing_consent: z.boolean().default(false),
  policy_version: z.string().trim().default('2026-05-16'),
});

// ─── Shipping address (international) ─────────────────────────────────────────
export const ShippingAddressSchema = z
  .object({
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
      .min(2, 'State / province is required')
      .max(100)
      .trim(),
    pincode: z
      .string()
      .trim()
      .min(2, 'Postal code is required')
      .max(20, 'Postal code is too long'),
    country_code: z
      .string()
      .trim()
      .length(2, 'Country is required')
      .transform((value) => value.toUpperCase()),
    country: z
      .string()
      .trim()
      .min(2, 'Country is required')
      .max(120),
  })
  .superRefine((data, ctx) => {
    if (data.country_code === 'IN' && !PINCODE_REGEX.test(data.pincode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pincode'],
        message: 'Please enter a valid 6-digit Indian pincode',
      });
    }
  });

// ─── Shipping method id (DB-backed plan) ────────────────────────────────────
export const ShippingMethodIdSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9_-]+$/);

export type ShippingMethodId = z.infer<typeof ShippingMethodIdSchema>;

// ─── Cart Item (for order creation) ─────────────────────────────────────────
export const OrderItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  name: z.string().min(1),
  sku: z.string().optional(),
  tag_number: z.string().nullable().optional(),
  quantity: z.number().int().min(1).max(10),
  price: z.number().min(0), // client-sent price (will be re-verified server-side)
  carat_weight: z.number().nullable().optional(),
  origin: z.string().nullable().optional(),
  image_url: z.string().optional(),
  category: z.string().optional(),
  configuration_id: z.string().uuid().optional(),
  configuration_summary: z.string().optional(),
  configuration_snapshot: z.unknown().optional(),
  delivery_eta_label: z.string().optional(),
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

// ─── Shipping methods (loaded from DB at checkout; no hard-coded free options) ─
export const SHIPPING_METHODS: Array<{ id: string; label: string; cost: number }> = [];

// ─── Full Order Creation Request ────────────────────────────────────────────
export const OrderCreateSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'Cart is empty'),
  contact: ContactInfoSchema,
  shipping_address: ShippingAddressSchema,
  shipping_method: ShippingMethodIdSchema,
  energization: EnergizationFieldsSchema.optional(),
  special_instructions: z.string().max(1000).trim().optional(),
  coupon_code: z.string().max(50).trim().optional(),
  reward_points_to_redeem: z.coerce.number().int().min(0).max(1000000).optional().default(0),
  checkout_consent: CheckoutConsentSchema,
  /** Longer inventory hold when customer will pay via bank transfer. */
  payment_method: z.enum(['razorpay', 'bank_transfer']).optional().default('razorpay'),
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
  /** Advance payment (20-100% of total). Omit to charge the full amount due. */
  pay_amount: z.coerce.number().positive().max(100_000_000).optional(),
});

// ─── Type exports ───────────────────────────────────────────────────────────
export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;
export type CheckoutConsent = z.infer<typeof CheckoutConsentSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type EnergizationFields = z.infer<typeof EnergizationFieldsSchema>;
export type OrderCreate = z.infer<typeof OrderCreateSchema>;
export type PaymentVerify = z.infer<typeof PaymentVerifySchema>;
export type PaymentCreateOrder = z.infer<typeof PaymentCreateOrderSchema>;

// ─── Offline / POS admin order ──────────────────────────────────────────────
export const CounterPaymentMethodSchema = z.enum(['cash', 'upi', 'card', 'bank_transfer']);
export const FulfillmentTypeSchema = z.enum(['delivery', 'pickup', 'in_store']);

const OfflineOrderItemBaseSchema = z.object({
  line_id: z.string().min(1).max(100).optional(),
  quantity: z.number().int().min(1).max(10).default(1),
  name: z.string().min(1).optional(),
  sku: z.string().optional(),
  tag_number: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  image_url: z.string().optional(),
  category: z.string().optional(),
  configuration_id: z.string().uuid().optional(),
  configuration_summary: z.string().optional(),
  configuration_snapshot: z.unknown().optional(),
  /** Catalog design pick without full configurator (stored on line snapshot) */
  design_id: z.string().uuid().optional(),
  design_name: z.string().max(200).optional(),
});

export const OfflineOrderItemSchema = z.union([
  OfflineOrderItemBaseSchema.extend({
    product_id: z.string().uuid('Invalid product ID'),
    manual_design: z.undefined().optional(),
  }),
  OfflineOrderItemBaseSchema.extend({
    product_id: z.null().optional(),
    name: z.string().trim().min(2).max(200),
    quantity: z.literal(1).default(1),
    manual_design: z.object({
      description: z.string().trim().max(1000).optional().default(''),
      item_price: z.coerce.number().min(0).max(100_000_000),
      metal_price: z.coerce.number().min(0).max(100_000_000).default(0),
      labour_charge: z.coerce.number().min(0).max(100_000_000).default(0),
      other_charge: z.coerce.number().min(0).max(100_000_000).default(0),
    }),
  }),
]);

export const OrderCommissionSchema = z.object({
  source: z.enum(['salesperson', 'astrologer']),
  name: z.string().trim().min(1).max(200),
  amount: z.coerce.number().min(0).max(100_000_000),
});

export const OfflineOrderCreateSchema = z
  .object({
    customer_id: z.string().uuid().nullable().optional(),
    contact: z.object({
      full_name: z.string().min(2).max(200).trim(),
      email: z
        .string()
        .trim()
        .toLowerCase()
        .optional()
        .default('')
        .refine((value) => !value || z.string().email().safeParse(value).success, 'Invalid email'),
      phone: z.string().regex(PHONE_REGEX, 'Please enter a valid phone number'),
      business_name: z.string().trim().max(220).optional().default(''),
      billing_gstin: z
        .string()
        .trim()
        .toUpperCase()
        .optional()
        .default('')
        .refine((value) => !value || GSTIN_REGEX.test(value), 'Please enter a valid GSTIN'),
    }),
    items: z.array(OfflineOrderItemSchema).min(1, 'Add at least one item'),
    customer_address: ShippingAddressSchema,
    fulfillment_type: FulfillmentTypeSchema.default('in_store'),
    shipping_address: ShippingAddressSchema.optional(),
    shipping_method: ShippingMethodIdSchema.optional(),
    special_instructions: z.string().max(1000).trim().optional(),
    coupon_code: z.string().max(50).trim().optional(),
    manual_discount: z.coerce.number().min(0).max(10_000_000).optional().default(0),
    energization_type: z.string().max(200).optional(),
    ceremony_dob: z.string().optional(),
    ceremony_gotra: z.string().max(100).optional(),
    ceremony_rashi: z.string().max(50).optional(),
    record_ceremony: z.boolean().optional().default(false),
    commissions: z.array(OrderCommissionSchema).max(20).optional().default([]),
    payment: z.object({
      amount: z.coerce.number().positive('Payment amount is required'),
      method: CounterPaymentMethodSchema,
      kind: z.enum(['advance', 'balance', 'full']).optional(),
      reference: z.string().max(200).trim().optional(),
      notes: z.string().max(500).trim().optional(),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment_type === 'delivery') {
      if (!data.shipping_address) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['shipping_address'],
          message: 'Shipping address is required for delivery',
        });
      }
      if (!data.shipping_method) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['shipping_method'],
          message: 'Shipping method is required for delivery',
        });
      }
    }
  });

export const RecordOrderPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  method: CounterPaymentMethodSchema,
  kind: z.enum(['advance', 'balance', 'full']).optional(),
  reference: z.string().max(200).trim().optional(),
  notes: z.string().max(500).trim().optional(),
});

export type OfflineOrderCreate = z.infer<typeof OfflineOrderCreateSchema>;
export type RecordOrderPayment = z.infer<typeof RecordOrderPaymentSchema>;
