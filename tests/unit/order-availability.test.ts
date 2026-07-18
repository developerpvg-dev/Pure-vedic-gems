import { describe, expect, it } from 'vitest';
import {
  collectOrderProductIds,
  paidHoldNote,
  paymentHoldNote,
} from '@/lib/inventory/order-availability';

describe('order-availability', () => {
  it('builds hold notes for an order number', () => {
    expect(paymentHoldNote('PVG-9')).toBe('Payment hold for PVG-9');
    expect(paidHoldNote('PVG-9')).toBe('Paid hold for PVG-9');
  });

  it('dedupes product ids from line items', () => {
    const ids = collectOrderProductIds({
      id: 'o1',
      order_number: 'PVG-9',
      items: [
        { product_id: 'a' },
        { product_id: 'a' },
        { product_id: 'b' },
        { product_id: null },
      ],
    });
    expect(ids).toEqual(['a', 'b']);
  });
});
