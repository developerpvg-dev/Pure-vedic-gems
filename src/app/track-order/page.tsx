import { OrderTrackingLookup } from '@/components/account/OrderTrackingLookup';
import { buildMetadata } from '@/lib/utils/seo';

export const metadata = buildMetadata({
  title: 'Track Order | PureVedicGems',
  description: 'Track a PureVedicGems order securely with your order number and email or phone verification.',
  path: '/track-order',
});

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen bg-brand-bg px-4 pb-20 pt-[120px] md:px-6">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--pvg-accent)]">Secure order lookup</p>
          <h1 className="mt-2 font-heading text-3xl text-[var(--pvg-primary)] md:text-5xl">Track Your Order</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--pvg-muted)]">Guest and account orders use private verification before shipment details are shown.</p>
        </div>
        <OrderTrackingLookup />
      </div>
    </main>
  );
}