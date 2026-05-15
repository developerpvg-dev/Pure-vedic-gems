import { z } from 'zod';

export const GuestSessionSchema = z.string().uuid();

export const CartItemInputSchema = z.object({
  key: z.string().min(1).max(160).optional(),
  product_id: z.string().uuid('Invalid product ID'),
  slug: z.string().max(240).optional(),
  sku: z.string().max(100).optional().default(''),
  tag_number: z.string().max(100).nullable().optional(),
  name: z.string().max(240).optional().default(''),
  category: z.string().max(100).optional().default(''),
  image_url: z.string().max(2000).optional().default(''),
  price: z.number().min(0).optional().default(0),
  quantity: z.number().int().min(1).max(99),
  stock_quantity: z.number().int().min(0).nullable().optional(),
  stock_status: z.string().max(40).nullable().optional(),
  availability_status: z.string().max(40).nullable().optional(),
  in_stock: z.boolean().nullable().optional(),
  sold_individually: z.boolean().nullable().optional(),
  carat_weight: z.number().nullable().optional(),
  origin: z.string().nullable().optional(),
  configuration_id: z.string().uuid().nullable().optional(),
  configuration_summary: z.string().max(500).nullable().optional(),
  configuration_snapshot: z.unknown().optional(),
  configuration_edit_url: z.string().max(500).nullable().optional(),
  delivery_eta_label: z.string().max(120).nullable().optional(),
});

export const CartMergeSchema = z.object({
  guest_session_id: GuestSessionSchema.optional(),
  items: z.array(CartItemInputSchema).max(100),
});

export const CartEventSchema = z.object({
  guest_session_id: GuestSessionSchema,
  event_type: z
    .enum(['cart_item_added', 'cart_item_updated', 'cart_item_removed', 'cart_cleared'])
    .default('cart_item_added'),
  product_id: z.string().uuid().optional(),
  quantity: z.number().int().min(0).max(100).optional(),
  value: z.number().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const CartUpdateSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

export type CartItemInput = z.infer<typeof CartItemInputSchema>;
export type CartMergeInput = z.infer<typeof CartMergeSchema>;
export type CartEventInput = z.infer<typeof CartEventSchema>;