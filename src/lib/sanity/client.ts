import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export const isSanityConfigured = Boolean(projectId && dataset);
export const SANITY_CONTENT_CACHE_TAG = 'sanity-content';
export const SANITY_SEARCH_CACHE_TAG = 'search-sanity-content';

export const sanityClient = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2024-01-01',
      // ponytail: CDN uses the separate (larger) APICDN quota; ~60s stale ok — webhook ISR still tags revalidate
      useCdn: true,
    })
  : null;

/** Write client (for webhooks / mutations from server) */
export const sanityWriteClient = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2024-01-01',
      useCdn: false,
      token: process.env.SANITY_API_TOKEN,
    })
  : null;

const builder = sanityClient ? createImageUrlBuilder(sanityClient) : null;

export async function sanityFetch<T>(query: string, params?: Record<string, unknown>, fallback: T = null as T) {
  if (!sanityClient) return fallback;
  try {
    return await sanityClient.fetch<T>(query, params ?? {}, {
      next: { tags: [SANITY_CONTENT_CACHE_TAG] },
    });
  } catch {
    // ponytail: 402 quota / outage must not fail `next build`; ISR fills in when Sanity is back
    return fallback;
  }
}

export function urlFor(source: SanityImageSource) {
  if (!builder) {
    throw new Error('Sanity image builder is unavailable because NEXT_PUBLIC_SANITY_PROJECT_ID is not configured.');
  }
  return builder.image(source);
}
