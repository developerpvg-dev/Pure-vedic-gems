import kvTagCache from '@opennextjs/cloudflare/overrides/tag-cache/kv-next-tag-cache';

type TagKv = {
  get(keys: string[], options: { type: 'json' }): Promise<Map<string, unknown>>;
  put(key: string, value: string): Promise<void>;
};

const TTL_MS = 30_000;
const MAX_ENTRIES = 5_000;
const memo = new Map<string, { value: unknown; at: number }>();

/**
 * Isolate-level memo of tag timestamps. KV bills every key of a bulk read and each cached page checks
 * 5-7 tags, so without this every ISR hit costs ~6 reads. KV itself serves reads up to 60s stale, so
 * 30s here does not widen the revalidation window in practice; this isolate's own writes apply at once.
 */
export function memoTagKv(kv: TagKv, clock: () => number = Date.now): TagKv {
  return {
    async get(keys, options) {
      const out = new Map<string, unknown>();
      const misses = keys.filter((key) => {
        const hit = memo.get(key);
        if (!hit || clock() - hit.at >= TTL_MS) return true;
        out.set(key, hit.value);
        return false;
      });
      if (misses.length) {
        const fetched = await kv.get(misses, options);
        // ponytail: wholesale clear instead of LRU; the tag key space is small (routes + layouts).
        if (memo.size > MAX_ENTRIES) memo.clear();
        const at = clock();
        for (const key of misses) {
          const value = fetched.get(key) ?? null;
          memo.set(key, { value, at });
          out.set(key, value);
        }
      }
      return out;
    },
    async put(key, value) {
      memo.delete(key);
      await kv.put(key, value);
    },
  };
}

// ponytail: getKv is private in the typings, so patch the instance rather than subclass.
const patchable = kvTagCache as unknown as { getKv(): TagKv | undefined };
const getKv = patchable.getKv.bind(patchable);
patchable.getKv = () => {
  const kv = getKv();
  return kv && memoTagKv(kv);
};

export default kvTagCache;
