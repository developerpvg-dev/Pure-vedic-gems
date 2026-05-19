import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type HealthCheck = {
  status: 'pass' | 'warn' | 'fail';
  message: string;
};

function envCheck(keys: string[], required: boolean): HealthCheck {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length === 0) {
    return { status: 'pass', message: 'configured' };
  }

  return {
    status: required ? 'fail' : 'warn',
    message: `${missing.length} ${required ? 'required' : 'optional'} variable${missing.length === 1 ? '' : 's'} missing`,
  };
}

export async function GET() {
  const startedAt = Date.now();
  const checks = {
    app: { status: 'pass', message: 'Next.js route handler responding' } satisfies HealthCheck,
    supabasePublic: envCheck(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'], true),
    supabaseAdmin: envCheck(['SUPABASE_SERVICE_ROLE_KEY'], process.env.NODE_ENV === 'production'),
    payments: envCheck(['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'], false),
    email: envCheck(['RESEND_API_KEY'], false),
    sentry: envCheck(['SENTRY_DSN', 'NEXT_PUBLIC_SENTRY_DSN'], false),
  };

  const failed = Object.values(checks).some((check) => check.status === 'fail');
  const status = failed ? 'degraded' : 'ok';

  return NextResponse.json(
    {
      service: 'purevedicgems',
      status,
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? 'local',
      response_time_ms: Date.now() - startedAt,
      checks,
    },
    {
      status: failed ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
      },
    },
  );
}