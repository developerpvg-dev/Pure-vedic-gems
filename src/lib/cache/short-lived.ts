type CacheEntry<T> = { expires: number; value: T };

const store = new Map<string, CacheEntry<unknown>>();

export async function getShortLivedCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.value as T;
  }

  const value = await loader();
  store.set(key, { expires: Date.now() + ttlMs, value });
  return value;
}
