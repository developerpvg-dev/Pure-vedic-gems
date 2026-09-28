/**
 * Vercel's CDN cached `public, s-maxage=N` responses (shop listings / blog via next.config headers, public APIs).
 * A Worker runs in front of Cloudflare's cache, so without this every such hit re-renders.
 * ISR pages (OpenNext sends `s-maxage` without `public`) are kept at most 60s: the same window the KV tag
 * cache already allows after revalidatePath, and a hit skips Next.js entirely.
 * ponytail: TTL-only (no purge on revalidatePath). Upgrade path: Cache-Tag headers + zone purge.
 */
const ISR_EDGE_TTL = 60;

const ROUTER_HEADERS = [
  'rsc',
  'next-router-state-tree',
  'next-router-prefetch',
  'next-router-segment-prefetch',
  'next-action',
  'authorization',
];

export function isEdgeCacheableRequest(request: Request): boolean {
  return request.method === 'GET' && !ROUTER_HEADERS.some((h) => request.headers.has(h));
}

/** The copy to store in the edge cache, or null when the response must not be shared. */
export function edgeCacheCopy(response: Response): Response | null {
  if (response.status !== 200 || response.headers.has('set-cookie')) return null;
  const cc = (response.headers.get('cache-control') ?? '').toLowerCase();
  const sMaxAge = Number(cc.match(/\bs-maxage=(\d+)/)?.[1] ?? 0);
  if (!sMaxAge || /\b(private|no-store|no-cache)\b/.test(cc)) return null;
  if (/\bpublic\b/.test(cc)) return response.clone();
  const copy = new Response(response.clone().body, response);
  copy.headers.set('cache-control', `public, s-maxage=${Math.min(sMaxAge, ISR_EDGE_TTL)}`);
  return copy;
}
