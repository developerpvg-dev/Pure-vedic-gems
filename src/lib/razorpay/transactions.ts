import { getRazorpayClient } from '@/lib/razorpay/client';

interface RazorpayOrderRecord {
  id: string;
  amount: number | string;
  currency: string;
  status?: string;
}

interface RazorpayPaymentRecord {
  id: string;
  order_id?: string;
  amount: number | string;
  currency: string;
  status?: string;
  captured?: boolean;
  method?: string;
  error_code?: string | null;
  error_description?: string | null;
}

interface RazorpayTransactionsClient {
  orders: {
    fetch: (orderId: string) => Promise<RazorpayOrderRecord>;
  };
  payments: {
    fetch: (paymentId: string) => Promise<RazorpayPaymentRecord>;
    capture: (paymentId: string, amount: number | string, currency: string) => Promise<RazorpayPaymentRecord>;
  };
}

export interface RazorpayPaymentFacts {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpayOrderAmountPaise: number;
  razorpayPaymentAmountPaise: number;
  currency: string;
  paymentStatus: string;
  orderStatus?: string;
  captured: boolean;
  method: string | null;
}

function toPaise(value: number | string) {
  return typeof value === 'string' ? Number.parseInt(value, 10) : value;
}

export async function fetchRazorpayPaymentFacts(
  razorpayOrderId: string,
  razorpayPaymentId: string
): Promise<RazorpayPaymentFacts> {
  const razorpay = getRazorpayClient() as unknown as RazorpayTransactionsClient;
  const [razorpayOrder, razorpayPayment] = await Promise.all([
    razorpay.orders.fetch(razorpayOrderId),
    razorpay.payments.fetch(razorpayPaymentId),
  ]);

  if (razorpayPayment.order_id && razorpayPayment.order_id !== razorpayOrderId) {
    throw new Error('Payment does not belong to this Razorpay order.');
  }

  return {
    razorpayOrderId: razorpayOrder.id,
    razorpayPaymentId: razorpayPayment.id,
    razorpayOrderAmountPaise: toPaise(razorpayOrder.amount),
    razorpayPaymentAmountPaise: toPaise(razorpayPayment.amount),
    currency: razorpayPayment.currency || razorpayOrder.currency,
    paymentStatus: razorpayPayment.status ?? 'unknown',
    orderStatus: razorpayOrder.status,
    captured: razorpayPayment.captured === true || razorpayPayment.status === 'captured',
    method: razorpayPayment.method ?? null,
  };
}

export async function captureAuthorizedRazorpayPayment(
  currentFacts: RazorpayPaymentFacts,
  razorpayPaymentId: string,
  amountPaise: number,
  currency: string
): Promise<RazorpayPaymentFacts> {
  if (currentFacts.captured) return currentFacts;

  if (currentFacts.paymentStatus !== 'authorized') {
    throw new Error(`Cannot capture Razorpay payment in ${currentFacts.paymentStatus} status.`);
  }

  if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
    throw new Error('Cannot capture Razorpay payment with an invalid amount.');
  }

  const razorpay = getRazorpayClient() as unknown as RazorpayTransactionsClient;
  let capturedPayment: RazorpayPaymentRecord;

  try {
    capturedPayment = await razorpay.payments.capture(razorpayPaymentId, amountPaise, currency.toUpperCase());
  } catch (captureError) {
    // Razorpay can auto-capture between our fetch and capture call. Re-check once
    // so that race does not leave an already-paid order pending.
    const latestFacts = await fetchRazorpayPaymentFacts(currentFacts.razorpayOrderId, razorpayPaymentId).catch(() => null);
    if (latestFacts?.captured) return latestFacts;
    throw captureError;
  }

  return {
    ...currentFacts,
    razorpayPaymentId: capturedPayment.id,
    razorpayPaymentAmountPaise: toPaise(capturedPayment.amount),
    currency: capturedPayment.currency || currentFacts.currency,
    paymentStatus: capturedPayment.status ?? currentFacts.paymentStatus,
    captured: capturedPayment.captured === true || capturedPayment.status === 'captured',
    method: capturedPayment.method ?? currentFacts.method,
  };
}