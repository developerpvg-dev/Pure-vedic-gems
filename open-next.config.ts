import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache';
import { purgeCache } from '@opennextjs/cloudflare/overrides/cache-purge/index';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import kvTagCache from '@opennextjs/cloudflare/overrides/tag-cache/kv-next-tag-cache';

/**
 * Large catalog + on-demand revalidatePath/Tag (shop, Sanity).
 * Requires R2 bucket, KV namespace + Durable Object bindings in wrangler.jsonc.
 */
export default defineCloudflareConfig({
  // Next 16: bypassTagCacheOnCacheHit would also disable refreshing the per-colo Cache API copy from R2,
  // so other machines kept serving the pre-revalidation page for up to `revalidate` seconds.
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: 'long-lived' }),
  queue: doQueue,
  // ponytail: KV, not the DO sharded tag cache — an idle Durable Object takes ~1.4s to wake, which a
  // low-traffic site hits on most page views. Cost: revalidatePath/Tag can take up to ~60s to apply
  // (KV is eventually consistent; same window as Sanity useCdn). Upgrade path at high traffic: DO tag cache.
  tagCache: kvTagCache,
  enableCacheInterception: true,
  // Needs CACHE_PURGE_API_TOKEN + CACHE_PURGE_ZONE_ID secrets (custom domain / zone).
  cachePurge: purgeCache({ type: 'durableObject' }),
});
