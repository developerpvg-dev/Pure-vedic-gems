import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import crypto from 'crypto';
import { SANITY_CONTENT_CACHE_TAG, SANITY_SEARCH_CACHE_TAG, sanityWriteClient } from '@/lib/sanity/client';
import { sanityRevalidatePaths } from '@/lib/sanity/webhook-paths';
import { bumpWorkerEdgeCache } from '@/lib/cloudflare/bump-edge-cache';
import { parseBabyLovePayload, publishBabyLoveArticle } from '@/lib/babylovegrowth/publish';

export const runtime = 'nodejs';
export const maxDuration = 120;

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function extractBearer(request: NextRequest): string {
  const auth = request.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m?.[1]) return m[1].trim();
  return (request.headers.get('x-api-key') || '').trim();
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status });
}

/**
 * POST /api/webhooks/babylovegrowth
 *
 * BabyLoveGrowth → Sanity blogPost. Configure in BLG Settings → Publishing → Webhook:
 *   URL:   https://www.purevedicgems.com/api/webhooks/babylovegrowth
 *   Token: BABYLOVEGROWTH_WEBHOOK_SECRET
 *
 * Idempotent on article id (`blg-article-{id}`). Retries update the same doc.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.BABYLOVEGROWTH_WEBHOOK_SECRET?.trim();
  if (!secret || secret.length < 8) {
    console.error('[babylovegrowth-webhook] BABYLOVEGROWTH_WEBHOOK_SECRET not configured');
    return json({ success: false, error: 'Webhook not configured' }, 500);
  }

  const token = extractBearer(request);
  if (!token || !timingSafeEqualStr(token, secret)) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  if (!sanityWriteClient) {
    return json({ success: false, error: 'Sanity write client not configured' }, 500);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON' }, 400);
  }

  const payload = parseBabyLovePayload(raw);
  if (!payload) {
    return json({ success: false, error: 'Missing required fields: id, title, slug' }, 400);
  }

  const asDraft = process.env.BABYLOVEGROWTH_PUBLISH_MODE?.trim().toLowerCase() === 'draft';

  try {
    const result = await publishBabyLoveArticle(sanityWriteClient, payload, { asDraft });
    if (!result.ok) {
      // BLG treats success:false on 200 as a failed publish (no retry for 4xx).
      return json({ success: false, error: result.error }, result.status ?? 200);
    }

    if (!asDraft) {
      for (const path of sanityRevalidatePaths('blogPost', result.slug)) {
        if (path.includes('[')) revalidatePath(path, 'page');
        else revalidatePath(path);
      }
      revalidatePath(`/blog/${result.slug}`);
      revalidateTag(SANITY_CONTENT_CACHE_TAG, 'max');
      revalidateTag(SANITY_SEARCH_CACHE_TAG, 'max');
      await bumpWorkerEdgeCache();
    }

    console.log(
      `[babylovegrowth-webhook] ${result.created ? 'created' : 'updated'} ${result.documentId} → ${result.link}${asDraft ? ' (draft)' : ''}`,
    );

    // Drafts are not publicly fetchable — omit link so BLG doesn't try to verify a 404.
    return json({
      success: true,
      ...(asDraft ? {} : { link: result.link }),
      documentId: result.documentId,
      created: result.created,
    });
  } catch (err) {
    console.error('[babylovegrowth-webhook] publish failed', err);
    // 503 → BLG retries up to 3×
    return json({ success: false, error: 'Publish failed' }, 503);
  }
}
