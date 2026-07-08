import { getApiErrorMessage, mapApiFieldErrors } from '@/lib/utils/api-validation';

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface CreateOrderResponse {
  consultation_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  plan_title: string;
  customer: {
    name: string;
    email: string;
    contact: string;
  };
}

export function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function verifyConsultationPayment(consultationId: string, response: RazorpayPaymentResponse) {
  const verifyRes = await fetch('/api/consultation/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consultation_id: consultationId,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    }),
  });

  const data = await verifyRes.json().catch(() => ({}));
  if (!verifyRes.ok) {
    throw new Error(data.error || 'Payment verification failed');
  }
  return data as { consultation_id: string };
}

export interface CreateOrderErrorResponse {
  error?: string;
  details?: Record<string, string[] | undefined>;
}

export async function startRs101Checkout(
  formBody: Record<string, string>,
  options: {
    onDismiss: () => void;
    onSuccess: (consultationId: string) => void;
    onError: (error: { message: string; fieldErrors?: Record<string, string> }) => void;
  }
) {
  const createRes = await fetch('/api/consultation/payment/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_id: 'rs101', ...formBody }),
  });

  const createData = (await createRes.json().catch(() => ({}))) as CreateOrderErrorResponse & CreateOrderResponse;
  if (!createRes.ok) {
    const fieldErrors = mapApiFieldErrors(createData.details);
    options.onError({
      message: getApiErrorMessage(createData, 'Unable to start payment. Please check your details and try again.'),
      fieldErrors,
    });
    return;
  }

  const payment = createData as CreateOrderResponse;
  if (!payment.key_id) {
    options.onError({ message: 'Payment gateway key is not configured.' });
    return;
  }

  const scriptReady = await loadRazorpayScript();
  if (!scriptReady || !window.Razorpay) {
    options.onError({ message: 'Unable to load Razorpay checkout. Please try again.' });
    return;
  }

  const checkout = new window.Razorpay({
    key: payment.key_id,
    amount: payment.amount,
    currency: payment.currency,
    name: 'PureVedicGems',
    description: 'Gem Recommendation - Rs 101',
    order_id: payment.razorpay_order_id,
    prefill: {
      name: formBody.full_name ?? '',
      email: formBody.email ?? '',
      contact: formBody.phone ?? '',
    },
    notes: { consultation_id: payment.consultation_id },
    theme: { color: '#7A1515' },
    modal: {
      ondismiss: options.onDismiss,
    },
    handler: (response: RazorpayPaymentResponse) => {
      void (async () => {
        try {
          const verified = await verifyConsultationPayment(payment.consultation_id, response);
          options.onSuccess(verified.consultation_id);
        } catch (error) {
          options.onError({
            message: error instanceof Error ? error.message : 'Payment verification failed',
          });
        }
      })();
    },
  });

  checkout.open();
}
