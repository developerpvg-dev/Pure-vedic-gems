import { buildAdminOrderTimeline } from '@/lib/orders/admin-timeline';

const labels = {
  confirmed: 'Confirmed',
  certification: 'Certification',
  shipped: 'Shipped',
  design_completed: 'Jewelry Completed',
};

const timeline = buildAdminOrderTimeline({
  createdAt: '2026-07-20T10:00:00.000Z',
  statusLabels: labels,
  events: [
    { status: 'confirmed', event_time: '2026-07-20T11:00:00.000Z' },
    { status: 'certification', event_time: '2026-07-21T09:00:00.000Z', note: 'Sent to lab' },
    { status: 'certification', event_time: '2026-07-22T09:00:00.000Z', note: 'later dup' },
    { status: 'shipped', event_time: '2026-07-25T08:00:00.000Z' },
  ],
  designCompletedAt: '2026-07-24T12:00:00.000Z',
  shippedAt: '2026-07-25T07:00:00.000Z',
});

console.assert(timeline[0]?.key === 'placed', 'starts with placed');
console.assert(timeline.some((e) => e.key === 'certification' && e.note === 'Sent to lab'), 'keeps earliest cert');
console.assert(!timeline.some((e) => e.note === 'later dup'), 'drops later cert dup');
console.assert(
  timeline.find((e) => e.key === 'shipped')?.at === '2026-07-25T07:00:00.000Z',
  'shipped uses earlier field date',
);
console.log('admin-timeline self-check ok');
