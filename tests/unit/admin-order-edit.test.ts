import { describe, expect, it } from 'vitest';

import { editedOrderBalances } from '@/lib/orders/admin-order-edit';

describe('editedOrderBalances', () => {
  it('keeps the advance and grows the due when charges are added', () => {
    expect(editedOrderBalances({ total: 10000, amount_paid: 3000, payment_status: 'partial' }, 12500)).toEqual({
      amount_paid: 3000,
      amount_due: 9500,
      payment_status: 'partial',
      overpaid: 0,
    });
  });

  it('flags overpayment when the total drops below what was paid', () => {
    const b = editedOrderBalances({ total: 10000, amount_paid: 10000, payment_status: 'captured' }, 8000);
    expect(b).toMatchObject({ amount_due: 0, payment_status: 'captured', overpaid: 2000 });
  });

  it('treats legacy captured orders without amount_paid as fully paid', () => {
    const b = editedOrderBalances({ total: 5000, amount_paid: null, payment_status: 'captured' }, 6000);
    expect(b).toMatchObject({ amount_paid: 5000, amount_due: 1000, payment_status: 'partial' });
  });

  it('leaves unpaid orders in their payment status', () => {
    const b = editedOrderBalances({ total: 5000, amount_paid: 0, payment_status: 'pending' }, 7000);
    expect(b).toMatchObject({ amount_paid: 0, amount_due: 7000, payment_status: 'pending' });
  });
});
