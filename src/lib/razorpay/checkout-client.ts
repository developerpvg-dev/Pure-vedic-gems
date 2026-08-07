'use client';

/**
 * Browser-side Razorpay checkout: create gateway order → open modal → verify.
 *
 * Shared by first-time checkout and the "pay balance" button on an order, so
 * both legs of an advance payment go through identical verification retries.
 */

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
  notes: Record<string, string>;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export type CheckoutStage = 'creating_payment' | 'paying' | 'verifying';

export interface RazorpayCheckoutInput {
  orderId: string;
  orderNumber: string;
  /** Advance amount in INR. Omit to pay the full outstanding balance. */
  payAmount?: number | null;
  /** Storefront currency for the Razorpay charge (default INR). */
  currency?: string;
  prefill: { name: string; email: string; contact: string };
  onStage?: (stage: CheckoutStage) => void;
  /** Modal closed without paying — the order is still saved. */
  onDismiss: () => void;
  onError: (message: string) => void;
  onSuccess: (result: { orderId: string; amountPaid: number }) => void;
}

/**
 * Runs the full payment leg. Resolves once the modal is open (or the flow
 * failed early); the outcome arrives through onSuccess / onError / onDismiss.
 */
export async function runRazorpayCheckout(input: RazorpayCheckoutInput): Promise<void> {
  const { orderId, orderNumber, payAmount, currency, prefill } = input;

  try {
    input.onStage?.('creating_payment');
    const paymentRes = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        ...(payAmount == null ? {} : { pay_amount: payAmount }),
        ...(currency ? { currency } : {}),
      }),
    });
    const paymentData = await paymentRes.json();
    if (!paymentRes.ok) throw new Error(paymentData.error || 'Failed to start payment');

    if (!(await loadRazorpayScript())) {
      throw new Error('Failed to load payment gateway. Please try again.');
    }

    input.onStage?.('paying');
    const rzp = new window.Razorpay({
      key: paymentData.key_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      name: 'PureVedicGems',
      description:
        paymentData.payment_kind === 'balance'
          ? `Balance for order ${orderNumber}`
          : paymentData.payment_kind === 'advance'
            ? `Advance for order ${orderNumber}`
            : `Order ${orderNumber}`,
      order_id: paymentData.razorpay_order_id,
      handler: async (response: RazorpayResponse) => {
        input.onStage?.('verifying');
        try {
          // Capture can lag the modal closing, so retry the 202 "pending" reply
          // before telling the customer anything went wrong.
          let verifyData: { success?: boolean; pending?: boolean; retry_after_ms?: number; error?: string } | null =
            null;
          for (let attempt = 1; attempt <= 3; attempt += 1) {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: orderId,
              }),
            });
            verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData?.error || 'Payment verification failed');
            if (verifyData?.success) break;
            if (!verifyData?.pending || attempt === 3) break;
            await wait(verifyData.retry_after_ms ?? 2500);
          }

          if (!verifyData?.success) {
            throw new Error(
              verifyData?.pending
                ? 'Payment is still being confirmed. Please wait a moment, then check your order status or contact support with your order number.'
                : 'Payment could not be confirmed. Please retry or contact support.',
            );
          }

          input.onSuccess({ orderId, amountPaid: Number(paymentData.pay_amount ?? 0) });
        } catch (verifyErr) {
          console.error('[Checkout] Verification error:', verifyErr);
          input.onError(
            verifyErr instanceof Error
              ? verifyErr.message
              : 'Payment could not be confirmed. Please retry or contact support.',
          );
        }
      },
      prefill,
      theme: { color: '#C9A84C' },
      modal: { ondismiss: input.onDismiss },
      notes: { order_id: orderId, order_number: orderNumber },
    });

    rzp.on('payment.failed', (response: { error: { description: string } }) => {
      input.onError(
        response.error.description ||
          'Payment failed. Please try again. Your order is saved for a short time.',
      );
    });
    rzp.open();
  } catch (err) {
    input.onError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
  }
}
