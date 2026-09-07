import { getSiteUrl } from '@/lib/utils/seo';
import { getPayGlocalConfig, requirePayGlocalConfig } from './config';
import { generateJweAndJws, signJws } from './jose';
import { formatPayGlocalAmount } from './status';
import { splitName, splitPhone, toAlpha3Country } from './country';

export type PayGlocalPayer = {
  fullName: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
};

export type PayGlocalInitiateInput = {
  merchantTxnId: string;
  amountMajor: number;
  currency: string;
  payer: PayGlocalPayer;
};

export type PayGlocalInitiateResult = {
  gid: string;
  redirectUrl: string;
  merchantTxnId: string;
};

export type PayGlocalStatusResult = {
  gid: string;
  status: string;
  merchantTxnId: string | null;
  amount: string | null;
  currency: string | null;
  txnCurrency: string | null;
  paymentMethod: string | null;
  raw: Record<string, unknown>;
};

function callbackUrl() {
  // Explicit override for tunnels / fixed Preview host.
  const override = process.env.PAYGLOCAL_CALLBACK_BASE_URL?.trim();
  if (override) return `${override.replace(/\/$/, '')}/api/payment/payglocal/callback`;
  // Preview only: post back to this deployment, not NEXT_PUBLIC_SITE_URL (live www).
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel && process.env.VERCEL_ENV === 'preview') {
    return `https://${vercel.replace(/^https?:\/\//i, '').replace(/\/$/, '')}/api/payment/payglocal/callback`;
  }
  return `${getSiteUrl().replace(/\/$/, '')}/api/payment/payglocal/callback`;
}

function authHeaders(jws: string) {
  const { merchantId, privateKeyId } = getPayGlocalConfig();
  return {
    'x-gl-token-external': jws,
    'x-gl-merchantid': merchantId,
    'x-gl-kid': privateKeyId,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function buildPayGlocalPayload(input: PayGlocalInitiateInput) {
  const name = splitName(input.payer.fullName);
  const phone = splitPhone(input.payer.phone);
  const country = toAlpha3Country(input.payer.country);
  const email = input.payer.email.trim().toLowerCase();

  return {
    merchantTxnId: input.merchantTxnId,
    merchantUniqueId: input.merchantTxnId,
    paymentData: {
      totalAmount: formatPayGlocalAmount(input.amountMajor, input.currency),
      txnCurrency: input.currency.toUpperCase(),
      billingData: {
        firstName: name.firstName,
        lastName: name.lastName,
        emailId: email,
        callingCode: phone.callingCode,
        phoneNumber: phone.phoneNumber,
        addressStreet1: input.payer.address1 || undefined,
        addressStreet2: input.payer.address2 || undefined,
        addressCity: input.payer.city || undefined,
        addressState: input.payer.state || undefined,
        addressPostalCode: input.payer.postalCode || undefined,
        addressCountry: country,
      },
    },
    riskData: {
      customerData: {
        firstName: name.firstName,
        lastName: name.lastName,
        emailId: email,
        callingCode: phone.callingCode,
        mobileNumber: phone.phoneNumber,
      },
      shippingData: {
        firstName: name.firstName,
        lastName: name.lastName,
        emailId: email,
        addressStreet1: input.payer.address1 || undefined,
        addressStreet2: input.payer.address2 || undefined,
        addressCity: input.payer.city || undefined,
        addressState: input.payer.state || undefined,
        addressPostalCode: input.payer.postalCode || undefined,
        addressCountry: country,
      },
    },
    merchantCallbackURL: callbackUrl(),
  };
}

export async function initiatePayGlocalPayment(input: PayGlocalInitiateInput): Promise<PayGlocalInitiateResult> {
  const config = requirePayGlocalConfig();
  const payload = buildPayGlocalPayload(input);
  const { jweToken, jwsToken } = await generateJweAndJws(payload);

  // PayGlocal email: Content-Type application/jose, body = JWE, header = JWS.
  const res = await fetch(`${config.baseUrl}/gl/v1/payments/initiate/paycollect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/jose',
      ...authHeaders(jwsToken),
    },
    body: jweToken,
  });

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = (JSON.parse(text) as Record<string, unknown>) ?? {};
  } catch {
    throw new Error(`PayGlocal initiate returned non-JSON (${res.status})`);
  }

  if (!res.ok) {
    const details = json.errorDetails ?? json.errors ?? json.message ?? text.slice(0, 300);
    throw new Error(`PayGlocal initiate failed (${res.status}): ${JSON.stringify(details)}`);
  }

  const data = asRecord(json.data);
  const redirectUrl = str(data?.redirectUrl);
  const gid = str(json.gid) ?? str(data?.gid);
  if (!redirectUrl || !gid) {
    throw new Error('PayGlocal initiate succeeded but did not return a redirect URL');
  }

  return {
    gid,
    redirectUrl,
    merchantTxnId: str(data?.merchantTxnId) ?? input.merchantTxnId,
  };
}

/** {id} is the gid or our merchantTxnId (sent as merchantUniqueId). */
export async function fetchPayGlocalStatus(id: string): Promise<PayGlocalStatusResult> {
  const config = requirePayGlocalConfig();
  // A GET has no body, so PayGlocal signs the digest over the request path instead.
  const path = `/gl/v1/payments/${encodeURIComponent(id)}/status`;
  const res = await fetch(`${config.baseUrl}${path}`, {
    method: 'GET',
    headers: authHeaders(await signJws(path, false)),
  });
  return readPayGlocalStatusResponse(res, id);
}

async function readPayGlocalStatusResponse(res: Response, fallbackId: string): Promise<PayGlocalStatusResult> {
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = (JSON.parse(text) as Record<string, unknown>) ?? {};
  } catch {
    throw new Error(`PayGlocal status returned non-JSON (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(`PayGlocal status failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = asRecord(json.data);
  // data.* is the transaction; json.gid is the id of this status request itself.
  return {
    gid: str(data?.gid) ?? str(json.gid) ?? fallbackId,
    status: str(data?.status) ?? str(json.status) ?? '',
    merchantTxnId: str(data?.merchantTxnId),
    amount: str(data?.Amount) ?? str(data?.amount) ?? str(data?.upiTxnAmount),
    currency: str(data?.Currency) ?? str(data?.currency),
    txnCurrency: str(data?.txnCurrency) ?? str(data?.upiTxnCurrency),
    paymentMethod: str(data?.['payment-method']) ?? str(data?.paymentMethod),
    raw: json,
  };
}
