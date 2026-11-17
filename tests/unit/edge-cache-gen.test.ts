import { describe, expect, it } from 'vitest';
import {
  EDGE_CACHE_GEN_KEY,
  bumpEdgeCacheGen,
  readEdgeCacheGen,
  resetEdgeCacheGenMemo,
} from '../../cloudflare/edge-cache-gen';

function fakeKv(store: Record<string, string>) {
  return {
    get: async (key: string) => store[key] ?? null,
    put: async (key: string, value: string) => {
      store[key] = value;
    },
  };
}

describe('edge cache gen', () => {
  it('reads from KV once per memo window and busts on bump', async () => {
    resetEdgeCacheGenMemo();
    let now = 1_000_000;
    const store: Record<string, string> = {};
    const kv = fakeKv(store);
    let gets = 0;
    const counting = {
      get: async (key: string) => {
        gets += 1;
        return kv.get(key);
      },
      put: kv.put,
    };

    expect(await readEdgeCacheGen(counting, () => now)).toBe('0');
    expect(await readEdgeCacheGen(counting, () => now + 50_000)).toBe('0');
    expect(gets).toBe(1);

    const bumped = await bumpEdgeCacheGen(counting, () => now + 50_500);
    expect(store[EDGE_CACHE_GEN_KEY]).toBe(bumped);
    expect(await readEdgeCacheGen(counting, () => now + 50_500)).toBe(bumped);

    now = now + 50_500 + 55_001;
    store[EDGE_CACHE_GEN_KEY] = 'from-other-isolate';
    expect(await readEdgeCacheGen(counting, () => now)).toBe('from-other-isolate');
  });
});
