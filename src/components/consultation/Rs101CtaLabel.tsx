'use client';

import { Money } from '@/components/currency/Money';
import { RS101_AMOUNT_INR } from '@/lib/consultation/rs101-amount';
import { useRs101Eligibility } from '@/lib/hooks/useRs101Eligibility';

/** CTA label — price suffix only for India (paid) visitors. */
export function Rs101CtaLabel({ base, paid: paidProp }: { base: string; paid?: boolean }) {
  const { paid: paidHook, ready } = useRs101Eligibility();
  const paid = paidProp ?? paidHook;

  if (paidProp === undefined && !ready) return <>{base}</>;
  if (!paid) return <>{base}</>;
  return (
    <>
      {base} — <Money amount={RS101_AMOUNT_INR} />
    </>
  );
}
