import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { rateLimit, resetRateLimitStore } from '@/lib/utils/rate-limit';

describe('rateLimit', () => {
  afterEach(() => {
    vi.useRealTimers();
    resetRateLimitStore();
  });

  it('allows requests until the configured window limit is reached', () => {
    const key = `unit:${randomUUID()}`;

    expect(rateLimit(key, 2, 60_000)).toBe(true);
    expect(rateLimit(key, 2, 60_000)).toBe(true);
    expect(rateLimit(key, 2, 60_000)).toBe(false);
  });

  it('resets the bucket after the window expires', () => {
    vi.useFakeTimers();
    const key = `unit:${randomUUID()}`;

    expect(rateLimit(key, 1, 1_000)).toBe(true);
    expect(rateLimit(key, 1, 1_000)).toBe(false);

    vi.advanceTimersByTime(1_001);

    expect(rateLimit(key, 1, 1_000)).toBe(true);
  });
});