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
  const fromForm = form?.get('x-gl-token') ?? form?.get('xGlToken') ?? form?.get('token');
  const formToken = typeof fromForm === 'string' ? fromForm.trim() : '';
  return (
    req.headers.get('x-gl-token') ||
    formToken ||
    (typeof json?.['x-gl-token'] === 'string' ? String(json['x-gl-token']).trim() : '') ||
    (typeof json?.xGlToken === 'string' ? String(json.xGlToken).trim() : '') ||
    (typeof json?.token === 'string' ? String(json.token).trim() : '') ||
    req.nextUrl.searchParams.get('x-gl-token') ||
    req.nextUrl.searchParams.get('token') ||
    ''
  );
}

async function readCallbackBody(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const parsed = await req.json().catch(() => null);
    return {
      form: null as FormData | null,
      json: parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null,
    };
  }

  // Clone so we can fall back to raw urlencoded parse if formData fails (some proxies).
  const raw = await req.text().catch(() => '');
  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded') || raw.includes('x-gl-token')) {
    try {
      const form = await new Request(req.url, {
        method: 'POST',
        headers: { 'content-type': contentType || 'application/x-www-form-urlencoded' },
        body: raw,
      }).formData();
      return { form, json: null as Record<string, unknown> | null };
    } catch {
      /* fall through */
    }
  }

  if (raw) {
    try {
      const params = new URLSearchParams(raw);
      const json: Record<string, unknown> = {};
      for (const [k, v] of params.entries()) json[k] = v;
      if (Object.keys(json).length) return { form: null, json };
    } catch {
      /* ignore */
    }
  }

  return { form: null, json: null };
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

  const { form, json } = await readCallbackBody(req);
  const token = extractToken(req, form, json);
  if (!token) {
    console.error('[PayGlocal callback] missing token', {
      method: req.method,
      contentType: req.headers.get('content-type'),
      formKeys: form ? [...form.keys()] : [],
      jsonKeys: json ? Object.keys(json) : [],
      query: Object.fromEntries(req.nextUrl.searchParams.entries()),
    });
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
