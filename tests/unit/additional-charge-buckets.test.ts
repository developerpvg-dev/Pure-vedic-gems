import { describe, expect, it } from 'vitest';
import {
  inferAdditionalChargeBucket,
  manualDesignForAdditionalCharge,
} from '@/lib/orders/additional-charge-buckets';
import { OfflineOrderCreateSchema } from '@/lib/validators/order';

describe('additional charge buckets', () => {
  it('puts the amount only on the chosen field', () => {
    const metal = manualDesignForAdditionalCharge('metal', 1500, 'Additional charge · Metal');
    expect(metal.metal_price).toBe(1500);
    expect(metal.item_price).toBe(0);
    expect(metal.certification_fee).toBe(0);
    expect(inferAdditionalChargeBucket(metal)).toBe('metal');

    const cert = manualDesignForAdditionalCharge('certification', 800, 'Additional charge · Certification');
    expect(cert.certification_fee).toBe(800);
    expect(inferAdditionalChargeBucket(cert)).toBe('certification');

    const ship = manualDesignForAdditionalCharge('shipping', 200, 'Additional charge · Shipping');
    expect(ship.shipping_fee).toBe(200);
    expect(inferAdditionalChargeBucket(ship)).toBe('shipping');
  });

  it('accepts certification/energization/shipping fees on offline manual lines', () => {
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
      items: [
        {
          line_id: 'charge-1',
          product_id: null,
          quantity: 1,
          name: 'Extra lab fee',
          manual_design: manualDesignForAdditionalCharge('certification', 500, 'Additional charge · Certification'),
        },
      ],
      commissions: [],
      fulfillment_type: 'in_store',
      payment: { amount: 500, method: 'cash' },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.items[0].manual_design?.certification_fee).toBe(500);
  });
});
