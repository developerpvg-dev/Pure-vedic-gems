import { createClient } from '@sanity/client';
import { unstable_cache } from 'next/cache';
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
      useCdn: true,
    })
  : null;

/** Same dataset, live API — used when the GROQ CDN (1M/mo) returns 402. */
export const sanityApiClient = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2024-01-01',
      useCdn: false,
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

// ponytail: one flag per isolate; after a 402, skip the CDN until the Worker restarts
let cdnExhausted = false;

export function isSanityQuotaError(err: unknown) {
  return (err as { statusCode?: number }).statusCode === 402;
}

/** Exported for tests. */
export function resetSanityCdnSkip() {
  cdnExhausted = false;
}

export async function groqFetch<T>(query: string, params?: Record<string, unknown>): Promise<T> {
  const p = params ?? {};
  if (!cdnExhausted && sanityClient) {
    try {
      return await sanityClient.fetch<T>(query, p);
    } catch (err) {
      if (!isSanityQuotaError(err) || !sanityApiClient) throw err;
      cdnExhausted = true;
    }
  }
  if (!sanityApiClient) throw new Error('Sanity is not configured');
  return sanityApiClient.fetch<T>(query, p);
}

export async function sanityFetch<T>(query: string, params?: Record<string, unknown>, fallback: T = null as T) {
  if (!sanityClient && !sanityApiClient) return fallback;
  try {
    // 1h in R2 (webhook still busts via SANITY_CONTENT_CACHE_TAG) so a CDN outage doesn't burn the 250k API quota
    return await unstable_cache(
      () => groqFetch<T>(query, params),
      ['sanity', query, JSON.stringify(params ?? {})],
      { revalidate: 3600, tags: [SANITY_CONTENT_CACHE_TAG] }
    )();
  } catch {
    // ponytail: 402 / outage must not fail `next build`; ISR fills in when Sanity is back
    return fallback;
  }
}

export function urlFor(source: SanityImageSource) {
  if (!builder) {
    throw new Error('Sanity image builder is unavailable because NEXT_PUBLIC_SANITY_PROJECT_ID is not configured.');
  }
  return builder.image(source);
}
