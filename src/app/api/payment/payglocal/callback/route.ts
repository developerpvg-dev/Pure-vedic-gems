import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import { isPayGlocalConfigured, isPayGlocalMerchantTxnId } from '@/lib/payglocal/config';
import { verifyPayGlocalJwt } from '@/lib/payglocal/jose';
import {
  callbackMerchantIdMatches,
  lookupMerchantTxnIdByGid,
  reconcilePayGlocalPayment,
  txnIdFromPayGlocalClaims,
} from '@/lib/payglocal/reconcile';

export const runtime = 'nodejs';

function redirectBase(req: NextRequest) {
  const result = process.env.PAYGLOCAL_RESULT_BASE_URL?.trim().replace(/\/$/, '');
  if (result) return result;
  const callback = process.env.PAYGLOCAL_CALLBACK_BASE_URL?.trim().replace(/\/$/, '');
  if (callback) return callback;
  const origin = req.nextUrl.origin;
  if (/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return origin.replace(/^https:/i, 'http:');
  }
  return origin;
}

function redirectTo(req: NextRequest, path: string, status = 303) {
  return NextResponse.redirect(new URL(path, redirectBase(req)), status);
}

function extractToken(req: NextRequest, form: FormData | null, json: Record<string, unknown> | null) {
  return (
    req.headers.get('x-gl-token') ||
    (typeof form?.get('x-gl-token') === 'string' ? String(form.get('x-gl-token')) : '') ||
    (typeof json?.['x-gl-token'] === 'string' ? String(json['x-gl-token']) : '') ||
    (typeof json?.xGlToken === 'string' ? String(json.xGlToken) : '')
  );
}

async function settleFromClaims(req: NextRequest, claims: Record<string, unknown>) {
  const parsed = txnIdFromPayGlocalClaims(claims);
  let merchantTxnId = parsed.merchantTxnId;
  const gid = parsed.gid;
  if (!merchantTxnId && gid) {
    merchantTxnId = (await lookupMerchantTxnIdByGid(gid)) ?? '';
  }

  if (!isPayGlocalMerchantTxnId(merchantTxnId) || !callbackMerchantIdMatches(parsed.merchantId)) {
    console.error('[PayGlocal callback] mismatch claims:', Object.keys(claims), {
      hasTxn: Boolean(merchantTxnId),
      hasGid: Boolean(gid),
      jwtStatus: parsed.status,
    });
    return redirectTo(req, '/pay/result?status=failed&reason=mismatch');
  }

  const result = await reconcilePayGlocalPayment(merchantTxnId, 'callback', gid, parsed.status);
  return redirectTo(req, result.redirectPath);
}

async function handleCallback(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`payglocal-cb:${ip}`, 30, 60 * 1000)) {
    return redirectTo(req, '/pay/result?status=failed&reason=rate_limited');
  }

  if (!isPayGlocalConfigured()) {
    return redirectTo(req, '/pay/result?status=failed&reason=not_configured');
  }

  const contentType = req.headers.get('content-type') ?? '';
  let form: FormData | null = null;
  let json: Record<string, unknown> | null = null;
  if (contentType.includes('application/json')) {
    const parsed = await req.json().catch(() => null);
    json = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } else {
    form = await req.formData().catch(() => null);
  }

  const token = extractToken(req, form, json);
  if (!token) {
    return redirectTo(req, '/pay/result?status=failed&reason=missing_token');
  }

  try {
    const claims = await verifyPayGlocalJwt(token);
    return settleFromClaims(req, claims);
  } catch (error) {
    console.error('[PayGlocal callback] JWT verify failed:', error);
    return redirectTo(req, '/pay/result?status=failed&reason=invalid_token');
  }
}

export async function POST(req: NextRequest) {
  return handleCallback(req);
}

/** Some PayGlocal flows bounce the browser with GET + query token. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('x-gl-token') ?? req.nextUrl.searchParams.get('token');
  if (!token) return redirectTo(req, '/pay/result?status=failed&reason=missing_token');
  if (!isPayGlocalConfigured()) {
    return redirectTo(req, '/pay/result?status=failed&reason=not_configured');
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`payglocal-cb:${ip}`, 30, 60 * 1000)) {
    return redirectTo(req, '/pay/result?status=failed&reason=rate_limited');
  }

  try {
    const claims = await verifyPayGlocalJwt(token);
    return settleFromClaims(req, claims);
  } catch (error) {
    console.error('[PayGlocal callback GET] failed:', error);
    return redirectTo(req, '/pay/result?status=failed&reason=invalid_token');
  }
}
