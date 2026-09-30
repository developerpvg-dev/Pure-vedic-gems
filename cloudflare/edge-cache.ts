/**
 * Vercel's CDN cached `public, s-maxage=N` responses (shop listings / blog via next.config headers, public APIs).
 * A Worker runs in front of Cloudflare's cache, so without this every such hit re-renders.
 * ISR pages (OpenNext sends `s-maxage` without `public`) are kept at most 60s: the same window the KV tag
 * cache already allows after revalidatePath, and a hit skips Next.js entirely.
 * ponytail: TTL-only (no purge on revalidatePath). Upgrade path: Cache-Tag headers + zone purge.
 */
const ISR_EDGE_TTL = 60;

// Headers Next.js varies page responses on (its `Vary`). The Cache API ignores Vary, so they go into the key.
const VARY_HEADERS = ['rsc', 'next-router-state-tree', 'next-router-prefetch', 'next-router-segment-prefetch', 'next-url'];

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Cache API key, or null when the request must always reach Next.js.
 * `version` (Worker version id) keeps a deploy from serving the previous build's HTML/RSC, whose chunks are gone.
 */
export async function edgeCacheKey(request: Request, version = ''): Promise<string | null> {
  if (request.method !== 'GET' || request.headers.has('next-action') || request.headers.has('authorization')) return null;
  const url = new URL(request.url);
  const vary = VARY_HEADERS.map((h) => request.headers.get(h) ?? '').join('\n');
  const varyHash = vary.trim() ? await sha256(vary) : '';
  if (version || varyHash) url.searchParams.set('__edge', `${version}.${varyHash}`);
  return url.toString();
}

/**
 * Cache API hits come back with the zone's Browser Cache TTL (4h) as max-age, which would keep stale
 * prices/stock in browsers and point them at JS chunks a later deploy removed.
 */
export function withBrowserRevalidate(hit: Response): Response {
  const res = new Response(hit.body, hit);
  res.headers.set('cache-control', 'public, max-age=0, must-revalidate');
  return res;
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
