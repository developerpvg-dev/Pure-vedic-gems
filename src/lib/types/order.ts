/**
 * Order-related types for PureVedicGems.
 */

export type OrderStatus =
  | 'pending_payment'
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'design_assigned'
  | 'design_in_progress'
  | 'design_completed'
  | 'jewelry_making'
  | 'certification'
  | 'energization'
  | 'quality_check'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'payment_review';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'amount_mismatch'
  | 'cancelled'
  | 'partial';

export type OrderSource = 'online' | 'offline';
export type FulfillmentType = 'delivery' | 'pickup' | 'in_store';

export interface OrderPaymentRecord {
  id: string;
  order_id: string;
  amount: number;
  method: 'cash' | 'upi' | 'card' | 'bank_transfer';
  kind: 'advance' | 'balance' | 'full' | 'refund_adjustment';
  reference: string | null;
  notes: string | null;
  recorded_by: string | null;
  paid_at: string;
  created_at: string;
}

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
  coupon_discount?: number;
  reward_points_redeemed?: number;
  reward_discount?: number;
  reward_points_earned?: number;
  manual_discount?: number;
  gst_amount: number;
  total: number;
  amount_paid?: number;
  amount_due?: number;
  order_source?: OrderSource;
  fulfillment_type?: FulfillmentType;
  created_by_admin_id?: string | null;
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
  carrier?: string | null;
  assigned_designer_id?: string | null;
  design_routed_at?: string | null;
  design_completed_at?: string | null;
  design_notes?: string | null;
  product_video_url?: string | null;
  puja_video_url?: string | null;
  estimated_delivery: string | null;
  shipped_at?: string | null;
  delivery_status?: string | null;
  invoice_number: string | null;
  invoice_url: string | null;
  /** Admin-only: salesperson / astrologer attribution */
  commission_source?: 'salesperson' | 'astrologer' | null;
  commission_name?: string | null;
  commission_amount?: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRecord {
  product_id: string;
  name: string;
  sku?: string;
  tag_number?: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  carat_weight?: number | null;
  origin?: string | null;
  image_url?: string;
  category?: string;
  configuration_id?: string;
  configuration_summary?: string;
  configuration_snapshot?: unknown;
  delivery_eta_label?: string | null;
}
