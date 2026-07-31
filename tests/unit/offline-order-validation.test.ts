import { describe, expect, it } from 'vitest';
import { OfflineOrderCreateSchema, isValidOfflinePhone, normalizeOfflinePhone } from '@/lib/validators/order';
import { formatZodValidationError, getApiErrorMessage } from '@/lib/utils/api-validation';

const validBase = {
  contact: { full_name: 'Test Customer', phone: '9876543210' },
  customer_address: {
    line1: '12 Test Street',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
    country: 'India',
    country_code: 'IN',
  },
  items: [{
    line_id: 'manual-1',
    product_id: null,
    quantity: 1,
    name: 'Customer ring',
    manual_design: {
      item_price: 5000,
      metal_price: 2500,
      labour_charge: 1200,
      other_charge: 300,
    },
  }],
  commissions: [
    { source: 'salesperson', name: 'Sales One', amount: 300 },
    { source: 'astrologer', name: 'Astrologer One', amount: 200 },
  ],
  fulfillment_type: 'in_store' as const,
  payment: { amount: 1000, method: 'cash' as const },
};

describe('offline order validation', () => {
  it('accepts a manual design, customer address, and multiple commissions', () => {
    const result = OfflineOrderCreateSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('normalizes spaced / trunk-0 phones before accept', () => {
    expect(normalizeOfflinePhone('098765 43210')).toBe('9876543210');
    expect(isValidOfflinePhone('+91 98765 43210')).toBe(true);
    const result = OfflineOrderCreateSchema.safeParse({
      ...validBase,
      contact: { full_name: 'Test Customer', phone: '098765 43210' },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.contact.phone).toBe('9876543210');
  });

  it('rejects bad Indian pincode with a clear message payload', () => {
    const result = OfflineOrderCreateSchema.safeParse({
      ...validBase,
      customer_address: { ...validBase.customer_address, pincode: '12' },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const payload = formatZodValidationError(result.error);
    expect(payload.error.toLowerCase()).toMatch(/pincode|postal/);
    expect(getApiErrorMessage(payload, 'fallback').toLowerCase()).toMatch(/pincode|postal/);
  });
});
