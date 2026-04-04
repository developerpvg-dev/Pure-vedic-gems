/**
 * Order-related types for PureVedicGems.
 */

export type OrderStatus =
  | 'pending_payment'
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'quality_check'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded';

export interface OrderRecord {
  id: string;
  order_number: string;
  customer_id: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_name: string | null;
  items: OrderItemRecord[];
  subtotal: number;
  jewelry_charges: number;
  metal_charges: number;
  certification_charges: number;
  energization_charges: number;
  shipping_cost: number;
  discount: number;
  coupon_code: string | null;
  gst_amount: number;
  total: number;
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  shipping_method: string | null;
  special_instructions: string | null;
  include_energization: boolean;
  energization_type: string | null;
  ceremony_gotra: string | null;
  ceremony_dob: string | null;
  ceremony_rashi: string | null;
  record_ceremony: boolean;
  payment_method: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  payment_status: PaymentStatus;
  status: OrderStatus;
  tracking_number: string | null;
  tracking_url: string | null;
  estimated_delivery: string | null;
  invoice_number: string | null;
  invoice_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRecord {
  product_id: string;
  name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  carat_weight?: number | null;
  origin?: string | null;
  image_url?: string;
  category?: string;
  configuration_id?: string;
  configuration_summary?: string;
}
