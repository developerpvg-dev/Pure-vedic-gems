'use client';

import { Money } from '@/components/currency/Money';
import { RS101_AMOUNT_INR } from '@/lib/consultation/rs101-amount';
import { useRs101Eligibility } from '@/lib/hooks/useRs101Eligibility';

/** Geo-aware hero line — keeps the page static (no server headers()). */
export function GemsRecHeroLead() {
  const { paid, ready } = useRs101Eligibility();
  const showPrice = ready && paid;

  if (!ready) {
    return <> Book online for expert Kundli guidance.</>;
  }

  return showPrice ? (
    <>
      {' '}
      Book online from <Money amount={RS101_AMOUNT_INR} />.
    </>
  ) : (
    <> Book online — complimentary for international clients.</>
  );
}

export function GemsRecFinaleCopy() {
  const { paid, ready } = useRs101Eligibility();
  const showPrice = ready && paid;

  if (!ready) {
    return <>Share your birth details and receive expert guidance by email.</>;
  }

  return showPrice ? (
    <>
      Pay <Money amount={RS101_AMOUNT_INR} />, share birth details, and receive expert guidance by email.
    </>
  ) : (
    <>Share your birth details and receive expert guidance by email.</>
  );
}
