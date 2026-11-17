import { describe, expect, it, vi } from 'vitest';

vi.mock('../../.open-next/worker.js', () => ({
  default: { fetch: async () => new Response('ok') },
  DOQueueHandler: class {},
  DOShardedTagCache: class {},
  BucketCachePurge: class {},
}));

const { isJunkBotPath, warmPathIfCold } = await import('../../cloudflare/worker');

describe('isJunkBotPath', () => {
  it('rejects WordPress and PHP probes only', () => {
    expect(isJunkBotPath('/wp-admin/')).toBe(true);
    expect(isJunkBotPath('/wp-login.php')).toBe(true);
    expect(isJunkBotPath('/xmlrpc.php')).toBe(true);
    expect(isJunkBotPath('/blog/foo.php')).toBe(true);
    expect(isJunkBotPath('/gemstones')).toBe(false);
    expect(isJunkBotPath('/shop/ruby')).toBe(false);
    expect(isJunkBotPath('/api/cart')).toBe(false);
  });
});

describe('warmPathIfCold', () => {
  it('skips self.fetch when the edge cache already has the path', async () => {
    const match = vi.fn(async () => new Response('cached'));
    const fetch = vi.fn(async () => new Response('fresh'));
    vi.stubGlobal('caches', { default: { match, put: vi.fn() } });

    await expect(warmPathIfCold('https://x', '/gemstones', { fetch }, 'v1', 'g1')).resolves.toBe('hit');
    expect(fetch).not.toHaveBeenCalled();
    expect(match).toHaveBeenCalled();
  });

  it('warms through self.fetch on an edge miss', async () => {
    const match = vi.fn(async () => undefined);
    const fetch = vi.fn(async () => new Response('fresh'));
    vi.stubGlobal('caches', { default: { match, put: vi.fn() } });

    await expect(warmPathIfCold('https://x', '/gemstones', { fetch }, 'v1', 'g1')).resolves.toBe('warmed');
    expect(fetch).toHaveBeenCalledOnce();
  });
});
