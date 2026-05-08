import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

export const isSanityConfigured = Boolean(projectId && dataset);

export const sanityClient = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2024-01-01',
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
  return sanityClient.fetch<T>(query, params ?? {});
}

export function urlFor(source: SanityImageSource) {
  if (!builder) {
    throw new Error('Sanity image builder is unavailable because NEXT_PUBLIC_SANITY_PROJECT_ID is not configured.');
  }
  return builder.image(source);
}
