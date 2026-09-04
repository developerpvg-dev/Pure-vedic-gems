import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isTurnstileProductionHost } from '@/lib/enquiry/turnstile-host';
import {
  TURNSTILE_COMMENT_ACTION,
  turnstileConfigured,
  verifyTurnstileToken,
} from '@/lib/enquiry/verify-turnstile';
import { rateLimit } from '@/lib/utils/rate-limit';

const commentCreateSchema = z.object({
  blog_slug: z.string().trim().min(1).max(300),
  body: z.string().trim().min(3).max(2000),
  turnstileToken: z.string().max(2048).optional(),
});

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.trim();
  if (!slug) {
    return NextResponse.json({ error: 'Blog slug is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('blog_comments')
    .select('id, author_name, body, created_at')
    .eq('blog_slug', slug)
    .eq('is_approved', true)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`blog-comment:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Please sign up or log in to comment.', code: 'auth_required' },
      { status: 401 }
    );
  }

  if (!rateLimit(`blog-comment-user:${user.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Comment limit reached. Try again later.' }, { status: 429 });
  }

  const parsed = commentCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid comment', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const host = request.headers.get('host') ?? '';
  const skipTurnstile = !isTurnstileProductionHost(host);
  const remoteIp = ip !== 'unknown' ? ip : undefined;

  if (turnstileConfigured() && !skipTurnstile) {
    const token = parsed.data.turnstileToken?.trim();
    if (!token || !(await verifyTurnstileToken(token, remoteIp, TURNSTILE_COMMENT_ACTION))) {
      return NextResponse.json(
        { error: 'Please complete the security check and try again.' },
        { status: 403 }
      );
    }
  }

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('full_name, email, account_status')
    .eq('id', user.id)
    .maybeSingle();

  const typedProfile = profile as {
    full_name: string | null;
    email: string | null;
    account_status: string | null;
  } | null;

  if (!typedProfile || typedProfile.account_status !== 'active') {
    return NextResponse.json(
      { error: 'Only registered customers can comment on blog posts.' },
      { status: 403 }
    );
  }

  const authorName =
    typedProfile.full_name?.trim() ||
    user.email?.split('@')[0] ||
    'Verified Customer';

  const { data: comment, error } = await supabase
    .from('blog_comments')
    .insert({
      blog_slug: parsed.data.blog_slug,
      customer_id: user.id,
      author_name: authorName,
      body: parsed.data.body,
      is_approved: true,
    })
    .select('id, author_name, body, created_at')
    .single();

  if (error || !comment) {
    console.error('[blog/comments] insert failed', error?.message, error?.code);
    return NextResponse.json({ error: 'Failed to submit comment' }, { status: 500 });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
