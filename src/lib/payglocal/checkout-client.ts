'use client';

import { useRs101Eligibility } from '@/lib/hooks/useRs101Eligibility';

export type PayGlocalCheckoutInput = {
  orderId: string;
  payAmount?: number | null;
  currency?: string;
  onStage?: (stage: 'creating_payment' | 'paying') => void;
  onError: (message: string) => void;
};

/**
 * Starts PayGlocal PayCollect and leaves this page for their hosted checkout.
 * Outcome comes back through merchantCallbackURL → /pay/result.
 */
export async function runPayGlocalCheckout(input: PayGlocalCheckoutInput): Promise<void> {
  try {
    input.onStage?.('creating_payment');
    const res = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: input.orderId,
        gateway: 'payglocal',
        ...(input.payAmount == null ? {} : { pay_amount: input.payAmount }),
        ...(input.currency ? { currency: input.currency } : {}),
      }),
    });
    const data = (await res.json()) as { error?: string; redirect_url?: string };
    if (!res.ok) throw new Error(data.error || 'Failed to start PayGlocal payment');
    if (!data.redirect_url) throw new Error('PayGlocal did not return a checkout URL');
    input.onStage?.('paying');
    window.location.assign(data.redirect_url);
  } catch (err) {
    input.onError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
  }
}

export function isPayGlocalUiEnabled() {
  return process.env.NEXT_PUBLIC_PAYGLOCAL_ENABLED === 'true';
}

/**
 * PayGlocal is for international buyers: shown only when the visitor's IP country is known and not India.
 * Same geo rule as the ₹101 India pricing (`paid` = India or unknown location, and until the lookup returns).
 * ponytail: UI-only; the create-order API still accepts gateway=payglocal from any visitor. Upgrade path: same geo check there.
 */
export function usePayGlocalUi() {
  const { paid } = useRs101Eligibility();
  return isPayGlocalUiEnabled() && !paid;
}
