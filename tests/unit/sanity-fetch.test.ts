import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cdnFetch = vi.fn();
const apiFetch = vi.fn();

vi.mock('next/cache', () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));

vi.mock('@sanity/client', () => ({
  createClient: ({ useCdn, token }: { useCdn?: boolean; token?: string }) => ({
    fetch: token ? vi.fn() : useCdn ? cdnFetch : apiFetch,
  }),
}));

vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'test-project');
vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'production');

const { groqFetch, isSanityQuotaError, resetSanityCdnSkip, sanityFetch } = await import('@/lib/sanity/client');

describe('sanity GROQ fallback', () => {
  beforeEach(() => {
    resetSanityCdnSkip();
    cdnFetch.mockReset();
    apiFetch.mockReset();
  });
  afterEach(() => resetSanityCdnSkip());

  it('treats Sanity 402 as a quota error', () => {
    expect(isSanityQuotaError({ statusCode: 402 })).toBe(true);
    expect(isSanityQuotaError({ statusCode: 500 })).toBe(false);
  });

  it('uses the live API after the CDN quota is exceeded, then skips the CDN', async () => {
    cdnFetch.mockRejectedValueOnce({ statusCode: 402, message: 'quota' });
    apiFetch.mockResolvedValueOnce([{ title: 'Ruby guide' }]);
    apiFetch.mockResolvedValueOnce([{ title: 'Pearl guide' }]);

    await expect(groqFetch('*[_type=="blogPost"]')).resolves.toEqual([{ title: 'Ruby guide' }]);
    await expect(groqFetch('*[_type=="blogPost"]')).resolves.toEqual([{ title: 'Pearl guide' }]);

    expect(cdnFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });

  it('returns the fallback when both GROQ endpoints fail', async () => {
    cdnFetch.mockRejectedValueOnce({ statusCode: 402 });
    apiFetch.mockRejectedValueOnce(new Error('down'));
    await expect(sanityFetch('*', undefined, [])).resolves.toEqual([]);
  });
});
