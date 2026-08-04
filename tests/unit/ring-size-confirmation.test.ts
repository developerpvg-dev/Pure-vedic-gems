import { describe, expect, it } from 'vitest';
import {
  beginRingSizeConfirmation,
  beginRingSizeConfirmationNotify,
  parseRingSizeConfirmation,
  recordRingSizeConfirmationUpload,
} from '@/lib/orders/ring-size-confirmation';

describe('ring size confirmation revisions', () => {
  it('supports multi-round admin re-request with remarks', () => {
    const started = beginRingSizeConfirmation({});
    expect(started.confirmation.round).toBe(1);
    expect(started.confirmation.status).toBe('pending');

    const uploaded = recordRingSizeConfirmationUpload(
      started.flags,
      'https://cdn.example.com/bad.jpg',
    );
    expect(uploaded.confirmation.status).toBe('submitted');

    const revised = beginRingSizeConfirmationNotify(
      uploaded.flags,
      'Scale is not centred — retake with scale in the middle',
    );
    expect(revised.confirmation.round).toBe(2);
    expect(revised.confirmation.status).toBe('pending');
    expect(revised.confirmation.admin_remarks).toMatch(/centred/i);
    expect(revised.confirmation.history).toHaveLength(1);
    expect(revised.confirmation.history[0]?.image_url).toBe('https://cdn.example.com/bad.jpg');
    expect(revised.confirmation.image_url).toBeUndefined();

    const fixed = recordRingSizeConfirmationUpload(
      revised.flags,
      'https://cdn.example.com/good.jpg',
    );
    expect(fixed.confirmation.status).toBe('submitted');
    expect(fixed.confirmation.round).toBe(2);
    expect(fixed.confirmation.image_url).toBe('https://cdn.example.com/good.jpg');
  });

  it('parses legacy ring_size_confirmation without round/history', () => {
    const legacy = parseRingSizeConfirmation({
      ring_size_confirmation: {
        status: 'submitted',
        requested_at: '2024-01-01T00:00:00.000Z',
        image_url: 'https://cdn.example.com/old.jpg',
      },
    });
    expect(legacy?.round).toBe(1);
    expect(legacy?.history).toEqual([]);
    expect(legacy?.image_url).toBe('https://cdn.example.com/old.jpg');
  });

  it('refreshes remarks on pending round without bumping', () => {
    const started = beginRingSizeConfirmation({});
    const again = beginRingSizeConfirmationNotify(started.flags, 'Please follow the guide image');
    expect(again.confirmation.round).toBe(1);
    expect(again.confirmation.admin_remarks).toMatch(/guide/i);
  });
});
