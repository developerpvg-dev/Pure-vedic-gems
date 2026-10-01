import { describe, expect, it } from 'vitest';

import { applyAdminOrderFilters } from '@/lib/admin/order-filters';

function recorder() {
  const calls: string[] = [];
  const query = {
    eq: (c: string, v: unknown) => (calls.push(`eq:${c}:${v}`), query),
    gte: (c: string, v: unknown) => (calls.push(`gte:${c}:${v}`), query),
    lte: (c: string, v: unknown) => (calls.push(`lte:${c}:${v}`), query),
    is: (c: string, v: null) => (calls.push(`is:${c}:${v}`), query),
    not: (c: string, op: string, v: null) => (calls.push(`not:${c}:${op}:${v}`), query),
    or: (f: string) => (calls.push(`or:${f}`), query),
  };
  return { query, calls };
}

describe('bill_status order filter', () => {
  it('completed = billing_completed_at not null', () => {
    const { query, calls } = recorder();
    applyAdminOrderFilters(query, { bill_status: 'completed' });
    expect(calls).toEqual(['not:billing_completed_at:is:null']);
  });

  it('pending = billing_completed_at is null', () => {
    const { query, calls } = recorder();
    applyAdminOrderFilters(query, { bill_status: 'pending' });
    expect(calls).toEqual(['is:billing_completed_at:null']);
  });
});
