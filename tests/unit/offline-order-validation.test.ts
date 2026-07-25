import { describe, expect, it } from 'vitest';
import { OfflineOrderCreateSchema } from '@/lib/validators/order';

describe('offline order validation', () => {
  it('accepts a manual design, customer address, and multiple commissions', () => {
    const result = OfflineOrderCreateSchema.safeParse({
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
      fulfillment_type: 'in_store',
      payment: { amount: 1000, method: 'cash' },
    });

    expect(result.success).toBe(true);
  });
});
