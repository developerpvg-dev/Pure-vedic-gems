/** Paths to bust after a Sanity publish. Bracket paths need revalidatePath(path, 'page'). */
export function sanityRevalidatePaths(docType: string | undefined, slug?: string): string[] {
  const type =
    docType === 'blog-post'
      ? 'blogPost'
      : docType === 'knowledge-article'
        ? 'knowledgeArticle'
        : docType === 'homepage-content'
          ? 'homepageContent'
          : docType;

  switch (type) {
    case 'blogPost':
      // ponytail: payload often omits slug; bust every post page, not only /blog listing
      return ['/blog', '/blog/[slug]', '/blog/category/[category]', '/'];
    case 'blogCategory':
      return ['/blog', slug ? `/blog/category/${slug}` : '/blog/category/[category]'];
    case 'knowledgeArticle':
      return [
        '/knowledge',
        '/knowledge/[slug]',
        '/knowledge/gemstones',
        '/knowledge/rudraksha',
        '/knowledge/astrology',
      ];
    default:
      return ['/'];
  }
}

export function payloadSlug(payload: { slug?: unknown }): string | undefined {
  if (typeof payload.slug === 'string' && payload.slug) return payload.slug;
  if (payload.slug && typeof payload.slug === 'object' && 'current' in payload.slug) {
    const current = (payload.slug as { current?: unknown }).current;
    return typeof current === 'string' && current ? current : undefined;
  }
  return undefined;
}
