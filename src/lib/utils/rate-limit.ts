/**
 * Simple in-process rate limiter for API routes.
 * Replace with Redis/Upstash in production for multi-instance deployments.
 */
const RL_MAP = new Map<string, { count: number; ts: number }>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = RL_MAP.get(key);
  if (!entry || now - entry.ts > windowMs) {
    RL_MAP.set(key, { count: 1, ts: now });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}
