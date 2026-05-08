import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

/**
 * POST /api/webhooks/sanity
 *
 * Handles Sanity CMS webhook events to revalidate pages when content changes.
 * Verifies the webhook secret via HMAC-SHA256 signature.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[sanity-webhook] SANITY_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Verify webhook signature
  const signature = request.headers.get('sanity-webhook-signature');
  const body = await request.text();

  if (signature) {
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSig) {
      console.warn('[sanity-webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } else {
    // Fallback: check secret as query param (Sanity GROQ-powered webhooks)
    const urlSecret = request.nextUrl.searchParams.get('secret');
    if (urlSecret !== secret) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }
  }

  let payload: {
    _type?: string;
    slug?: { current?: string };
    _id?: string;
  };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const docType = payload._type;
  const slug = payload.slug?.current;

  // Revalidate relevant pages based on document type
  const revalidated: string[] = [];

  switch (docType) {
    case 'blogPost':
      revalidatePath('/blog');
      revalidated.push('/blog');
      if (slug) {
        revalidatePath(`/blog/${slug}`);
        revalidated.push(`/blog/${slug}`);
      }
      // Also revalidate category pages
      revalidatePath('/blog/category/[category]', 'page');
      revalidated.push('/blog/category/*');
      break;

    case 'blogCategory':
      revalidatePath('/blog');
      revalidated.push('/blog');
      if (slug) {
        revalidatePath(`/blog/category/${slug}`);
        revalidated.push(`/blog/category/${slug}`);
      }
      break;

    case 'knowledgeArticle':
      revalidatePath('/knowledge');
      revalidated.push('/knowledge');
      if (slug) {
        revalidatePath(`/knowledge/${slug}`);
        revalidated.push(`/knowledge/${slug}`);
      }
      revalidatePath('/knowledge/gemstones');
      revalidatePath('/knowledge/rudraksha');
      revalidatePath('/knowledge/astrology');
      revalidatePath('/knowledge/buying-guides');
      revalidated.push('/knowledge/category-pages');
      break;

    case 'testimonial':
      revalidatePath('/');
      revalidated.push('/');
      break;

    default:
      // Unknown type — revalidate homepage as fallback
      revalidatePath('/');
      revalidated.push('/');
  }

  console.log(`[sanity-webhook] Revalidated: ${revalidated.join(', ')} for ${docType}/${slug || payload._id}`);

  return NextResponse.json({
    revalidated: true,
    paths: revalidated,
    now: Date.now(),
  });
}
