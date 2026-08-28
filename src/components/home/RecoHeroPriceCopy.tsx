'use client';

import { Money } from '@/components/currency/Money';
import { RS101_AMOUNT_INR } from '@/lib/consultation/rs101-amount';
import { useRs101Eligibility } from '@/lib/hooks/useRs101Eligibility';

type RecoHeroPriceCopyProps = {
  /** Server geo when available — avoids price flash for international visitors. */
  rs101Paid?: boolean;
};

/** Homepage / gems-reco hero copy — price only for India visitors. */
export function RecoHeroPriceCopy({ rs101Paid: rs101PaidProp }: RecoHeroPriceCopyProps = {}) {
  const { paid: paidHook, ready } = useRs101Eligibility();
  const paid = rs101PaidProp ?? paidHook;
  const showPrice = rs101PaidProp !== undefined ? paid : ready && paid;

  return (
    <>
      <p className="reco-img-sub">
        {showPrice ? (
          <>
            Share your birth details, pay just <Money amount={RS101_AMOUNT_INR} />, and our Vedic experts will recommend the perfect gemstone aligned with your planetary chart.
          </>
        ) : (
          <>
            Share your birth details and our Vedic experts will recommend the perfect gemstone aligned with your planetary chart.
          </>
        )}
      </p>
      <div className="reco-img-trust">
        {showPrice ? (
          <span className="reco-img-trust-pill">
            <Money amount={RS101_AMOUNT_INR} /> Only
          </span>
        ) : (
          <span className="reco-img-trust-pill">Complimentary</span>
        )}
        <span className="reco-img-trust-pill">Expert Review</span>
      </div>
    </>
  );
}
