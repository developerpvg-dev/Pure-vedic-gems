import { describe, expect, it } from 'vitest';
import { edgeCacheCopy, edgeCacheKey, withBrowserRevalidate } from '../../cloudflare/edge-cache';

const res = (cc: string | null, init: ResponseInit = {}) =>
  new Response('x', { status: 200, ...init, headers: { ...(cc ? { 'cache-control': cc } : {}), ...init.headers } });

describe('edge cache', () => {
  it('keys GETs by URL, deploy version and the headers Next varies on', async () => {
    expect(await edgeCacheKey(new Request('https://x/gemstones'))).toBe('https://x/gemstones');
    expect(await edgeCacheKey(new Request('https://x/gemstones', { method: 'POST' }))).toBeNull();
    expect(await edgeCacheKey(new Request('https://x/gemstones', { headers: { 'next-action': 'a' } }))).toBeNull();
    expect(await edgeCacheKey(new Request('https://x/api/products', { headers: { authorization: 'Bearer t' } }))).toBeNull();

    const v1 = await edgeCacheKey(new Request('https://x/gemstones'), 'v1');
    expect(v1).not.toBe(await edgeCacheKey(new Request('https://x/gemstones'), 'v2'));

    const rsc = (h: Record<string, string>) => edgeCacheKey(new Request('https://x/gemstones?_rsc=abc', { headers: h }), 'v1');
    const html = await rsc({});
    const prefetch = await rsc({ rsc: '1', 'next-router-prefetch': '1' });
    const nav = await rsc({ rsc: '1', 'next-router-state-tree': '%5B%22%22%5D' });
    expect(new Set([html, prefetch, nav, v1]).size).toBe(4);
    expect(await rsc({ rsc: '1', 'next-router-prefetch': '1' })).toBe(prefetch);
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

  it('serves edge hits with browser revalidation instead of the zone Browser Cache TTL', async () => {
    const hit = withBrowserRevalidate(res('public, max-age=14400, s-maxage=900', { headers: { 'content-type': 'text/html' } }));
    expect(hit.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate');
    expect(hit.headers.get('content-type')).toBe('text/html');
    expect(await hit.text()).toBe('x');
  });
});
