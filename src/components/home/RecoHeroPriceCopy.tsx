'use client';

import { Money } from '@/components/currency/Money';
import { RS101_AMOUNT_INR } from '@/lib/consultation/rs101-amount';

/** Homepage reco hero copy — price follows storefront currency. */
export function RecoHeroPriceCopy() {
  return (
    <>
      <p className="reco-img-sub">
        Share your birth details, pay just <Money amount={RS101_AMOUNT_INR} />, and our Vedic experts will recommend the perfect gemstone aligned with your planetary chart.
      </p>
      <div className="reco-img-trust">
        <span className="reco-img-trust-pill">
          <Money amount={RS101_AMOUNT_INR} /> Only
        </span>
        <span className="reco-img-trust-pill">Expert Review</span>
      </div>
    </>
  );
}
