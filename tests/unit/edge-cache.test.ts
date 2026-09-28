import { describe, expect, it } from 'vitest';
import { isEdgeCacheableRequest, isEdgeCacheableResponse } from '../../cloudflare/edge-cache';

const res = (cc: string | null, init: ResponseInit = {}) =>
  new Response('x', { status: 200, ...init, headers: { ...(cc ? { 'cache-control': cc } : {}), ...init.headers } });

describe('edge cache', () => {
  it('caches only plain GET page/API requests', () => {
    expect(isEdgeCacheableRequest(new Request('https://x/gemstones'))).toBe(true);
    expect(isEdgeCacheableRequest(new Request('https://x/gemstones', { method: 'POST' }))).toBe(false);
    expect(isEdgeCacheableRequest(new Request('https://x/gemstones', { headers: { rsc: '1' } }))).toBe(false);
    expect(isEdgeCacheableRequest(new Request('https://x/api/products', { headers: { authorization: 'Bearer t' } }))).toBe(false);
  });

  it('stores public s-maxage responses only', () => {
    expect(isEdgeCacheableResponse(res('public, s-maxage=900, stale-while-revalidate=60'))).toBe(true);
    // OpenNext ISR responses: handled by the incremental cache, purged on revalidate
    expect(isEdgeCacheableResponse(res('s-maxage=1435, stale-while-revalidate=2592000'))).toBe(false);
    expect(isEdgeCacheableResponse(res('private, no-cache, no-store, max-age=0, must-revalidate'))).toBe(false);
    expect(isEdgeCacheableResponse(res('public, s-maxage=0'))).toBe(false);
    expect(isEdgeCacheableResponse(res(null))).toBe(false);
    expect(isEdgeCacheableResponse(res('public, s-maxage=60', { status: 404 }))).toBe(false);
    expect(isEdgeCacheableResponse(res('public, s-maxage=60', { headers: { 'set-cookie': 'a=b' } }))).toBe(false);
  });
});
