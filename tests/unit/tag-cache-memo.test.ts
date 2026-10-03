import { describe, expect, it, vi } from 'vitest';

vi.mock('@opennextjs/cloudflare/overrides/tag-cache/kv-next-tag-cache', () => ({ default: { getKv: () => undefined } }));

const { memoTagKv } = await import('../../cloudflare/tag-cache-memo');

function fakeKv(store: Record<string, unknown>) {
  const reads: string[][] = [];
  return {
    reads,
    get: async (keys: string[]) => {
      reads.push(keys);
      return new Map(keys.map((k) => [k, store[k] ?? null]));
    },
    put: async (key: string, value: string) => {
      store[key] = Number(value);
    },
  };
}

describe('memoTagKv', () => {
  it('reads each tag from KV once per 30s, re-reads after expiry or a local write', async () => {
    let now = 1_000_000;
    const kv = fakeKv({ 'b/a': 1, 'b/b': 2 });
    const memo = memoTagKv(kv, () => now);

    expect([...(await memo.get(['b/a', 'b/b'], { type: 'json' })).values()]).toEqual([1, 2]);
    await memo.get(['b/a', 'b/b', 'b/c'], { type: 'json' });
    expect(kv.reads).toEqual([['b/a', 'b/b'], ['b/c']]);

    await memo.put('b/a', '5');
    expect((await memo.get(['b/a'], { type: 'json' })).get('b/a')).toBe(5);

    now += 30_000;
    await memo.get(['b/b'], { type: 'json' });
    expect(kv.reads.at(-1)).toEqual(['b/b']);
  });
});
