import { describe, expect, it } from 'vitest';
import { normalizeHttpsUrlList } from '@/lib/orders/returns';
import { getCustomerJourney } from '@/lib/orders/customer-journey';

describe('product design media lists', () => {
  it('normalizes https URL lists', () => {
    expect(
      normalizeHttpsUrlList([
        ' https://youtu.be/a ',
        'ftp://bad',
        '',
        12,
        'https://cdn.example.com/1.jpg',
      ]),
    ).toEqual(['https://youtu.be/a', 'https://cdn.example.com/1.jpg']);
  });

  it('exposes multiple product videos and images on journey', () => {
    const journey = getCustomerJourney({
      status: 'design_completed',
      payment_status: 'paid',
      product_video_urls: ['https://youtu.be/one', 'https://youtu.be/two'],
      product_image_urls: ['https://cdn.example.com/a.jpg'],
      items: [
        {
          category: 'jewellery',
          configuration_snapshot: { selections: { setting_type: 'ring' } },
        },
      ],
    });
    const step = journey?.milestones.find((m) => m.key === 'product_video');
    expect(step?.videoUrls).toEqual(['https://youtu.be/one', 'https://youtu.be/two']);
    expect(step?.imageUrls).toEqual(['https://cdn.example.com/a.jpg']);
    expect(step?.done).toBe(true);
  });
});
