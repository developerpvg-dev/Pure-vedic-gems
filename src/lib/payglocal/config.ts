/**
 * PayGlocal credentials — server-only. Never import from client components.
 *
 * Keys come from GCC → Key Management. UAT keys do not work in production.
 */

function readEnv(name: string) {
  return process.env[name]?.trim() || '';
}

/** Accepts PEM with real newlines or `\n` escapes from .env.local. */
export function normalizePem(raw: string) {
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value.replace(/\\n/g, '\n').trim();
}

export function getPayGlocalConfig() {
  const merchantId = readEnv('PAYGLOCAL_MERCHANT_ID');
  const privateKeyId = readEnv('PAYGLOCAL_PRIVATE_KEY_ID');
  const publicKeyId = readEnv('PAYGLOCAL_PUBLIC_KEY_ID');
  const privateKey = normalizePem(readEnv('PAYGLOCAL_PRIVATE_KEY'));
  const publicKey = normalizePem(readEnv('PAYGLOCAL_PUBLIC_KEY'));
  const env = readEnv('PAYGLOCAL_ENV').toLowerCase() === 'prod' ? 'prod' : 'uat';

  return {
    merchantId,
    privateKeyId,
    publicKeyId,
    privateKey,
    publicKey,
    env,
    baseUrl: env === 'prod' ? 'https://api.payglocal.in' : 'https://api.uat.payglocal.in',
  };
}

export function isPayGlocalConfigured() {
  const c = getPayGlocalConfig();
  return Boolean(c.merchantId && c.privateKeyId && c.publicKeyId && c.privateKey && c.publicKey);
}

export function requirePayGlocalConfig() {
  if (!isPayGlocalConfigured()) {
    throw new Error(
      'PayGlocal is not configured. Set PAYGLOCAL_MERCHANT_ID, PAYGLOCAL_PRIVATE_KEY, PAYGLOCAL_PRIVATE_KEY_ID, PAYGLOCAL_PUBLIC_KEY, and PAYGLOCAL_PUBLIC_KEY_ID.',
    );
  }
  return getPayGlocalConfig();
}

export function isPayGlocalEnabledOnClient() {
  return process.env.NEXT_PUBLIC_PAYGLOCAL_ENABLED === 'true';
}

export type PayGlocalKind = 'order' | 'consultation' | 'yagya';

const KIND_CODE: Record<PayGlocalKind, string> = {
  order: 'O',
  consultation: 'C',
  yagya: 'Y',
};

const KIND_FROM_CODE: Record<string, PayGlocalKind> = {
  O: 'order',
  C: 'consultation',
  Y: 'yagya',
};

/** Alphanumeric merchantTxnId (PayGlocal rejects hyphens). Unguessable. */
export function newMerchantTxnId(kind: PayGlocalKind) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `PVG${KIND_CODE[kind]}${hex}`;
}

export function parseMerchantTxnId(id: string): PayGlocalKind | null {
  const m = /^PVG([OCY])[A-F0-9]{32}$/i.exec(id.trim());
  return m ? (KIND_FROM_CODE[m[1].toUpperCase()] ?? null) : null;
}

export function isPayGlocalMerchantTxnId(id: string | null | undefined) {
  return !!id && parseMerchantTxnId(id) != null;
}
