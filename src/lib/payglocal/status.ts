import { toRazorpayMinor } from '@/lib/razorpay/charge-currency';

export const PAYGLOCAL_CAPTURED = 'SENT_FOR_CAPTURE';
export const PAYGLOCAL_AUTHORIZED = 'AUTHORIZED';
export const PAYGLOCAL_IN_PROGRESS = 'INPROGRESS';

/** Every "Final status" in the integration guide that is not a capture. */
const FAILED = new Set([
  'ISSUER_DECLINE',
  'CUSTOMER_CANCELLED',
  'ABANDONED',
  'GENERAL_DECLINE',
  'FAILED',
  'DECLINED',
  'AUTHENTICATION_TIMEOUT',
  'AUTHENTICATION_FAILURE',
  'AUTHENTICATION_FAILED',
  'REQUEST_ERROR',
  'SYSTEM_ERROR',
  'CONFIG_ERROR',
  'CONDITIONAL_DECLINE',
]);

export function normalizePayGlocalStatus(status: string | null | undefined) {
  return String(status ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

export function isPayGlocalCaptured(status: string | null | undefined) {
  const s = normalizePayGlocalStatus(status);
  return s === PAYGLOCAL_CAPTURED || s === 'CAPTURED' || s.includes('SENT_FOR_CAPTURE');
}

export function isPayGlocalAuthorized(status: string | null | undefined) {
  return normalizePayGlocalStatus(status) === PAYGLOCAL_AUTHORIZED;
}

export function isPayGlocalFailed(status: string | null | undefined) {
  const s = normalizePayGlocalStatus(status);
  return FAILED.has(s) || s.includes('CONFIG_ERROR');
}

export function isPayGlocalPending(status: string | null | undefined) {
  const s = normalizePayGlocalStatus(status);
  return s === PAYGLOCAL_IN_PROGRESS || s === 'IN_PROGRESS' || s === '' || s === 'CREATED';
}

export function formatPayGlocalAmount(major: number, currency: string) {
  const factor = toRazorpayMinor(1, currency);
  return factor === 1 ? String(Math.round(major)) : major.toFixed(2);
}

export function payGlocalAmountToMinor(amount: string | number | null | undefined, currency: string) {
  if (typeof amount !== 'number') {
    // Number('') is 0, so a missing amount would otherwise read as a zero-rupee payment.
    const trimmed = String(amount ?? '').replace(/,/g, '').trim();
    if (!trimmed) return null;
    amount = Number(trimmed);
  }
  if (!Number.isFinite(amount)) return null;
  return toRazorpayMinor(amount, currency);
}

export function amountsMatch(expectedMinor: number, actualMinor: number | null, currency: string) {
  if (actualMinor == null) return false;
  // JPY is 1:1; others allow 1 minor unit of FX rounding on their side.
  const slack = toRazorpayMinor(1, currency) === 1 ? 0 : 1;
  return Math.abs(expectedMinor - actualMinor) <= slack;
}

/**
 * PayGlocal Get Status often returns Amount in INR (`Currency`) even when we
 * charged USD (`txnCurrency`). Accept either the charged currency or the INR ledger.
 * Missing amount (JWT-only callback) is treated as a match — status already verified.
 */
export function payGlocalChargeMatches(args: {
  expectedMinor: number;
  expectedCurrency: string;
  amount: string | number | null | undefined;
  currencies: Array<string | null | undefined>;
  ledgerInrMinor?: number | null;
}) {
  if (payGlocalAmountToMinor(args.amount, args.expectedCurrency) == null) return true;

  const expected = args.expectedCurrency.toUpperCase();
  const seen = new Set<string>();
  for (const raw of [...args.currencies, expected, 'INR']) {
    const code = String(raw ?? '').trim().toUpperCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    const actual = payGlocalAmountToMinor(args.amount, code);
    if (actual == null) continue;
    if (code === expected && amountsMatch(args.expectedMinor, actual, expected)) return true;
    if (code === 'INR' && args.ledgerInrMinor != null && amountsMatch(args.ledgerInrMinor, actual, 'INR')) {
      return true;
    }
  }
  return false;
}
