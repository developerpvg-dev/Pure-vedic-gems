/**
 * Vercel's CDN cached `public, s-maxage=N` responses (shop listings via next.config headers, public APIs).
 * A Worker runs in front of Cloudflare's cache, so without this every such hit re-renders.
 * ponytail: TTL-only (no purge on revalidatePath) — same 15-minute ceiling next.config accepted on Vercel.
 * ISR pages (OpenNext sends `s-maxage` without `public`) are left to OpenNext's own cache.
 */
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

export function isEdgeCacheableResponse(response: Response): boolean {
  if (response.status !== 200 || response.headers.has('set-cookie')) return false;
  const cc = (response.headers.get('cache-control') ?? '').toLowerCase();
  return /\bpublic\b/.test(cc) && /\bs-maxage=[1-9]/.test(cc) && !/\b(private|no-store|no-cache)\b/.test(cc);
}
