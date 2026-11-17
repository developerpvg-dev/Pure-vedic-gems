/** KV key for Worker Cache API generation — bumping it makes every old edge entry miss. */
export const EDGE_CACHE_GEN_KEY = '__pvg_edge_cache_gen';

type KvGetPut = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

// ponytail: 55s isolate memo — same ceiling as tag-cache-memo / KV EC. Every request reads gen
// before Cache API match; 5s was billing a KV get on the hot path ~12×/min/isolate.
let memo: { value: string; at: number } | null = null;
const MEMO_MS = 55_000;

export async function readEdgeCacheGen(kv: KvGetPut | undefined, clock: () => number = Date.now): Promise<string> {
  if (!kv) return '0';
  const now = clock();
  if (memo && now - memo.at < MEMO_MS) return memo.value;
  const value = (await kv.get(EDGE_CACHE_GEN_KEY)) ?? '0';
  memo = { value, at: now };
  return value;
}

export async function bumpEdgeCacheGen(kv: KvGetPut | undefined, clock: () => number = Date.now): Promise<string> {
  const value = String(clock());
  memo = { value, at: clock() };
  if (kv) await kv.put(EDGE_CACHE_GEN_KEY, value);
  return value;
}

/** Test helper — clears isolate memo between cases. */
export function resetEdgeCacheGenMemo() {
  memo = null;
}
