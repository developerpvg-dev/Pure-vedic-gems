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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`payglocal-wh:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  if (!isPayGlocalConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const raw = await req.text();
  const token =
    req.headers.get('x-gl-token') ||
    req.headers.get('x-gl-token-external') ||
    '';

  let body: Record<string, unknown> | null = null;
  if (raw) {
    try {
      body = asRecord(JSON.parse(raw));
    } catch {
      body = null;
    }
  }
  if (token) {
    try {
      body = await verifyPayGlocalJwt(token);
    } catch (error) {
      console.error('[PayGlocal webhook] JWT verify failed:', error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = txnIdFromPayGlocalClaims(body);
  let merchantTxnId = parsed.merchantTxnId;
  const gid = parsed.gid;
  if (!isPayGlocalMerchantTxnId(merchantTxnId) && gid) {
    merchantTxnId = (await lookupMerchantTxnIdByGid(gid)) ?? '';
  }

  if (!isPayGlocalMerchantTxnId(merchantTxnId)) {
    return NextResponse.json({ error: 'Missing merchantTxnId' }, { status: 400 });
  }
  if (!callbackMerchantIdMatches(parsed.merchantId)) {
    return NextResponse.json({ error: 'Merchant mismatch' }, { status: 401 });
  }

  try {
    const result = await reconcilePayGlocalPayment(merchantTxnId, 'webhook', gid, parsed.status);
    return NextResponse.json({ status: result.outcome });
  } catch (error) {
    console.error('[PayGlocal webhook] reconcile failed:', error);
    return NextResponse.json({ status: 'processing_error' });
  }
}
