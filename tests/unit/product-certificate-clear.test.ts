import { describe, expect, it } from 'vitest';
import { productUpdateSchema } from '@/lib/validators/product';
import { applyNoCertificationFields } from '@/lib/utils/format';
import { adminPaymentStatusLabel } from '@/lib/admin/order-filters';

describe('clearing a product certificate', () => {
  it('keeps null so an update can wipe certificate_url / file_url', () => {
    const parsed = productUpdateSchema.parse({
      certificate_url: null,
      certificate_file_url: '',
      certificate_number: null,
      certificate_lab: '',
    });
    expect(parsed.certificate_url).toBeNull();
    expect(parsed.certificate_file_url).toBeNull();
    expect(parsed.certificate_number).toBeNull();
    expect(parsed.certificate_lab).toBeNull();
  });

  it('leaves omitted certificate fields untouched', () => {
    const parsed = productUpdateSchema.parse({});
    expect(parsed.certificate_url).toBeUndefined();
    expect(parsed.certificate_file_url).toBeUndefined();
  });

  it('nulls lab scan fields when certification is None', () => {
    const payload: Record<string, unknown> = {
      certification: 'None',
      certificate_url: 'https://cdn.example.com/lab.pdf',
      certificate_file_url: 'https://cdn.example.com/lab.pdf',
    };
    applyNoCertificationFields(payload);
    expect(payload.certification).toBeNull();
    expect(payload.certificate_url).toBeNull();
    expect(payload.certificate_file_url).toBeNull();
    expect(payload.certificate_number).toBeNull();
    expect(payload.certificate_lab).toBeNull();
  });
});

describe('admin payment filter labels', () => {
  it('calls captured fully paid and partial partially paid', () => {
    expect(adminPaymentStatusLabel('captured')).toBe('Fully paid');
    expect(adminPaymentStatusLabel('partial')).toBe('Partially paid');
    expect(adminPaymentStatusLabel('pending')).toBe('Pending');
  });
});
