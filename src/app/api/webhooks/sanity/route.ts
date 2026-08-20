import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import crypto from 'crypto';
import { parseBody } from 'next-sanity/webhook';
import { SANITY_CONTENT_CACHE_TAG, SANITY_SEARCH_CACHE_TAG } from '@/lib/sanity/client';
import { payloadSlug, sanityRevalidatePaths } from '@/lib/sanity/webhook-paths';

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function bust(path: string) {
  if (path.includes('[')) revalidatePath(path, 'page');
  else revalidatePath(path);
}

/**
 * POST /api/webhooks/sanity
 *
 * Sanity signs with `t=<unix>,v1=<hmac>` of `${t}.${body}` — not HMAC(body).
 * parseBody from next-sanity verifies that and waits ~3s for the Content Lake.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[sanity-webhook] SANITY_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let payload: { _type?: string; slug?: unknown; _id?: string } | null = null;

  const signature = request.headers.get('sanity-webhook-signature');
  if (signature) {
    const parsed = await parseBody<{ _type?: string; slug?: unknown; _id?: string }>(request, secret);
    if (parsed.isValidSignature !== true || !parsed.body) {
      console.warn('[sanity-webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    payload = parsed.body;
  } else {
    const urlSecret = request.nextUrl.searchParams.get('secret') ?? '';
    if (!timingSafeEqualStr(urlSecret, secret)) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }
    try {
      payload = JSON.parse(await request.text());
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
  }

  const docType = payload?._type;
  const slug = payload ? payloadSlug(payload) : undefined;
  const paths = sanityRevalidatePaths(docType, slug);
  for (const path of paths) bust(path);
  revalidateTag(SANITY_CONTENT_CACHE_TAG, 'max');
  revalidateTag(SANITY_SEARCH_CACHE_TAG, 'max');

  console.log(`[sanity-webhook] Revalidated: ${paths.join(', ')} for ${docType}/${slug || payload?._id}`);

  return NextResponse.json({
    revalidated: true,
    paths,
    now: Date.now(),
  });
}
