import { describe, expect, it } from 'vitest';
import { edgeCacheCopy, isEdgeCacheableRequest } from '../../cloudflare/edge-cache';

const res = (cc: string | null, init: ResponseInit = {}) =>
  new Response('x', { status: 200, ...init, headers: { ...(cc ? { 'cache-control': cc } : {}), ...init.headers } });

describe('edge cache', () => {
  it('caches only plain GET page/API requests', () => {
    expect(isEdgeCacheableRequest(new Request('https://x/gemstones'))).toBe(true);
    expect(isEdgeCacheableRequest(new Request('https://x/gemstones', { method: 'POST' }))).toBe(false);
    expect(isEdgeCacheableRequest(new Request('https://x/gemstones', { headers: { rsc: '1' } }))).toBe(false);
    expect(isEdgeCacheableRequest(new Request('https://x/api/products', { headers: { authorization: 'Bearer t' } }))).toBe(false);
  });

  it('stores public s-maxage responses as-is', () => {
    const copy = edgeCacheCopy(res('public, s-maxage=900, stale-while-revalidate=60'));
    expect(copy?.headers.get('cache-control')).toBe('public, s-maxage=900, stale-while-revalidate=60');
  });

  it('caps OpenNext ISR responses at 60s', async () => {
    const copy = edgeCacheCopy(res('s-maxage=1435, stale-while-revalidate=2592000'));
    expect(copy?.headers.get('cache-control')).toBe('public, s-maxage=60');
    expect(await copy?.text()).toBe('x');
    expect(edgeCacheCopy(res('s-maxage=1, stale-while-revalidate=2592000'))?.headers.get('cache-control')).toBe('public, s-maxage=1');
  });

  it('never stores private, uncacheable, failed or cookie-setting responses', () => {
    expect(edgeCacheCopy(res('private, no-cache, no-store, max-age=0, must-revalidate'))).toBeNull();
    expect(edgeCacheCopy(res('public, s-maxage=0'))).toBeNull();
    expect(edgeCacheCopy(res(null))).toBeNull();
    expect(edgeCacheCopy(res('public, s-maxage=60', { status: 404 }))).toBeNull();
    expect(edgeCacheCopy(res('public, s-maxage=60', { headers: { 'set-cookie': 'a=b' } }))).toBeNull();
  });
});
