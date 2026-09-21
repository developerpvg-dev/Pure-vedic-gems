import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache';
import { purgeCache } from '@opennextjs/cloudflare/overrides/cache-purge/index';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import doShardedTagCache from '@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache';

/**
 * Large catalog + on-demand revalidatePath/Tag (shop, Sanity).
 * Requires R2 bucket + Durable Object bindings in wrangler.jsonc.
 */
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: 'long-lived',
    bypassTagCacheOnCacheHit: true,
  }),
  queue: doQueue,
  tagCache: doShardedTagCache({ baseShardSize: 12 }),
  enableCacheInterception: true,
  // Needs CACHE_PURGE_API_TOKEN + CACHE_PURGE_ZONE_ID secrets (custom domain / zone).
  cachePurge: purgeCache({ type: 'durableObject' }),
});
