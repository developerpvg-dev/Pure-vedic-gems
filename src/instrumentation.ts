import type { Instrumentation } from 'next';

// Sentry (+ its OpenTelemetry setup) loads only when a DSN is configured: on Workers every
// fresh isolate would otherwise pay its startup cost for an SDK that is disabled anyway.
export async function register() {
  if (!process.env.SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!process.env.SENTRY_DSN) return;
  const { captureRequestError } = await import('@sentry/nextjs');
  captureRequestError(...args);
};
