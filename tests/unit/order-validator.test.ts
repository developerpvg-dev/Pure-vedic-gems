import { describe, expect, it } from 'vitest';
import { CheckoutConsentSchema, ContactInfoSchema, OrderCreateSchema } from '@/lib/validators/order';

const contact = {
  full_name: 'Priya Sharma',
  email: 'PRIYA@example.com',
  phone: '+919999999999',
};

const shippingAddress = {
  line1: '22 Main Market Road',
  city: 'New Delhi',
  state: 'Delhi',
  pincode: '110001',
  country: 'India',
};

describe('order validators', () => {
  it('normalizes business GST invoice contact details', () => {
    const parsed = ContactInfoSchema.parse({
      ...contact,
      email: 'BUYER@EXAMPLE.COM',
      business_name: ' Pure Vedic Buyer Pvt Ltd ',
      billing_gstin: '07abcde1234f1z5',
    });

    expect(parsed.email).toBe('buyer@example.com');
    expect(parsed.business_name).toBe('Pure Vedic Buyer Pvt Ltd');
    expect(parsed.billing_gstin).toBe('07ABCDE1234F1Z5');
  });

  it('rejects malformed GSTIN values', () => {
    expect(ContactInfoSchema.safeParse({ ...contact, billing_gstin: 'BAD-GSTIN' }).success).toBe(false);
  });

  it('requires checkout policy consent before order creation', () => {
    const validConsent = CheckoutConsentSchema.safeParse({
      terms_accepted: true,
      privacy_accepted: true,
      return_policy_accepted: true,
      marketing_consent: false,
    });

    expect(validConsent.success).toBe(true);
    expect(CheckoutConsentSchema.safeParse({ terms_accepted: false }).success).toBe(false);
  });

  it('validates a minimal launch-safe order request', () => {
    const result = OrderCreateSchema.safeParse({
      items: [
        {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Certified Ruby',
          quantity: 1,
          price: 25000,
        },
      ],
      contact,
      shipping_address: shippingAddress,
      shipping_method: 'standard',
      checkout_consent: {
        terms_accepted: true,
        privacy_accepted: true,
        return_policy_accepted: true,
      },
    });

    expect(result.success).toBe(true);
  });
});