import { describe, expect, it } from 'vitest';
import {
  canClaimProductForOrder,
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

  it('allows reclaim after cancel / expired hold, blocks active foreign hold', () => {
    expect(
      canClaimProductForOrder(
        { id: 'p', availability_status: 'in_stock', reservation_note: null, reserved_until: null },
        'PVG-2',
      ),
    ).toBe(true);

    expect(
      canClaimProductForOrder(
        {
          id: 'p',
          availability_status: 'reserved',
          reservation_note: paidHoldNote('PVG-1'),
          reserved_until: new Date(Date.now() + 60_000).toISOString(),
        },
        'PVG-2',
      ),
    ).toBe(false);

    expect(
      canClaimProductForOrder(
        {
          id: 'p',
          availability_status: 'reserved',
          reservation_note: paymentHoldNote('PVG-1'),
          reserved_until: new Date(Date.now() - 1000).toISOString(),
        },
        'PVG-2',
      ),
    ).toBe(true);
  });
});
