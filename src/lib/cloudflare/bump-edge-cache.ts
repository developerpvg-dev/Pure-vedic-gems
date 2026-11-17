import { bumpEdgeCacheGen } from '../../../cloudflare/edge-cache-gen';

type TagKv = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

// ponytail: coalesce sync multi-product revalidate loops into one KV put (same-tick / <2s).
let lastBumpAt = 0;
const BUMP_DEBOUNCE_MS = 2_000;

/** Bust Worker Cache API entries after ISR revalidate (no-op outside Cloudflare). */
export async function bumpWorkerEdgeCache(force = false): Promise<void> {
  const now = Date.now();
  if (!force && lastBumpAt && now - lastBumpAt < BUMP_DEBOUNCE_MS) return;
  lastBumpAt = now;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext({ async: true });
    const kv = (env as { NEXT_TAG_CACHE_KV?: TagKv }).NEXT_TAG_CACHE_KV;
    await bumpEdgeCacheGen(kv);
  } catch {
    // Local next dev / missing bindings — edge cache is not in play.
  }
}

/** Test helper */
export function resetBumpWorkerEdgeCacheDebounce() {
  lastBumpAt = 0;
}
