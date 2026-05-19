/**
 * Simple in-process rate limiter for API routes.
 * Replace with Redis/Upstash in production for multi-instance deployments.
 */
const RL_MAP = new Map<string, { count: number; resetAt: number }>();
const MAX_TRACKED_KEYS = 5_000;

function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of RL_MAP.entries()) {
    if (now > entry.resetAt) {
      RL_MAP.delete(key);
    }
  }
}

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (RL_MAP.size > MAX_TRACKED_KEYS) {
    cleanupExpiredEntries(now);
  }

  const entry = RL_MAP.get(key);
  if (!entry || now > entry.resetAt) {
    RL_MAP.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export function resetRateLimitStore() {
  RL_MAP.clear();
}
