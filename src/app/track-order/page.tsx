import { Suspense } from 'react';
import { OrderTrackingLookup } from '@/components/account/OrderTrackingLookup';
import { buildMetadata } from '@/lib/utils/seo';
import './track-order-page.css';

export const metadata = buildMetadata({
  title: 'Track Order | PureVedicGems',
  description: 'Track a PureVedicGems order securely with your order number and email or phone verification.',
  path: '/track-order',
});

function TrackOrderFallback() {
  return (
    <div className="mx-auto max-w-[1120px] px-4 py-16 text-center text-sm text-[#5a5043] sm:px-6">
      Loading order tracking…
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="px-4 pb-8 pt-10 sm:px-6 lg:pt-14" aria-labelledby="track-order-heading">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-0 flex flex-col items-center justify-center">
            <h1 className="section-title" id="track-order-heading">
              Track Your Order
            </h1>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Guest and account orders use private verification before shipment details are shown.
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-4 sm:px-6" aria-label="Order tracking lookup">
        <Suspense fallback={<TrackOrderFallback />}>
          <OrderTrackingLookup />
        </Suspense>
      </section>
    </main>
  );
}
