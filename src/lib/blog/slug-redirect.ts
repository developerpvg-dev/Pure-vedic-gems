export type BlogSlugRow = { slug: string; title?: string | null; previousSlugs?: string[] | null };

/** Unicode-safe URL key: keeps letters, Devanagari marks and digits; everything else collapses to "-". */
function slugKey(value: string) {
  return value
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Current slug for a blog URL that no longer matches: a renamed slug (previousSlugs),
 * a title-as-slug link, or a WordPress permalink truncated mid-word.
 */
export function matchBlogRedirectSlug(requested: string, posts: BlogSlugRow[]): string | null {
  const want = slugKey(requested);
  if (!want) return null;
  const keysOf = (p: BlogSlugRow) =>
    [p.slug, p.title ?? '', ...(p.previousSlugs ?? [])].map(slugKey).filter(Boolean);

  const exact = posts.find((p) => keysOf(p).includes(want));
  if (exact) return exact.slug;
  // ponytail: prefix match only for long keys so "/blog/ruby" can't hijack a random post
  if (want.length < 15) return null;
  return posts.find((p) => keysOf(p).some((k) => k.startsWith(want)))?.slug ?? null;
}
