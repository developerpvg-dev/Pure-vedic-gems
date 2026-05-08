import { sanityFetch } from './client';

// ── Blog Queries ─────────────────────────────────────────────────────

const BLOG_POST_FIELDS = `
  _id,
  title,
  slug,
  excerpt,
  "category": category->{ _id, title, slug },
  mainImage,
  publishedAt,
  "author": author->{ name, image, bio },
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 200)
`;

const BLOG_POST_DETAIL_FIELDS = `
  _id,
  _type,
  title,
  slug,
  excerpt,
  body,
  "category": category->{ _id, title, slug },
  mainImage,
  publishedAt,
  "author": author->{ name, image, bio },
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 200),
  seoTitle,
  seoDescription,
  ogImage
`;

/** All published blog posts, sorted by date */
export async function getAllBlogPosts(limit = 50, offset = 0) {
  return sanityFetch(
    `*[_type == "blogPost" && !(_id in path("drafts.**"))] | order(publishedAt desc) [${offset}...${offset + limit}] {
      ${BLOG_POST_FIELDS}
    }`,
    undefined,
    []
  );
}

/** Total count of blog posts */
export async function getBlogPostCount() {
  return sanityFetch<number>(
    `count(*[_type == "blogPost" && !(_id in path("drafts.**"))])`,
    undefined,
    0
  );
}

/** Single blog post by slug */
export async function getBlogPostBySlug(slug: string) {
  return sanityFetch(
    `*[_type == "blogPost" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
      ${BLOG_POST_DETAIL_FIELDS}
    }`,
    { slug },
    null
  );
}

/** Blog posts by category slug */
export async function getBlogPostsByCategory(categorySlug: string, limit = 50, offset = 0) {
  return sanityFetch(
    `*[_type == "blogPost" && category->slug.current == $categorySlug && !(_id in path("drafts.**"))] | order(publishedAt desc) [${offset}...${offset + limit}] {
      ${BLOG_POST_FIELDS}
    }`,
    { categorySlug },
    []
  );
}

/** Count posts in a category */
export async function getBlogPostCountByCategory(categorySlug: string) {
  return sanityFetch<number>(
    `count(*[_type == "blogPost" && category->slug.current == $categorySlug && !(_id in path("drafts.**"))])`,
    { categorySlug },
    0
  );
}

/** All blog categories */
export async function getAllBlogCategories() {
  return sanityFetch(
    `*[_type == "blogCategory"] | order(title asc) {
      _id,
      title,
      slug,
      description,
      "postCount": count(*[_type == "blogPost" && category._ref == ^._id && !(_id in path("drafts.**"))])
    }`,
    undefined,
    []
  );
}

/** Single category by slug */
export async function getBlogCategoryBySlug(slug: string) {
  return sanityFetch(
    `*[_type == "blogCategory" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      description
    }`,
    { slug },
    null
  );
}

/** Featured blog post (latest featured or most recent) */
export async function getFeaturedBlogPost() {
  return sanityFetch(
    `*[_type == "blogPost" && featured == true && !(_id in path("drafts.**"))] | order(publishedAt desc) [0] {
      ${BLOG_POST_FIELDS}
    }`,
    undefined,
    null
  );
}

/** Related posts (same category, excluding current) */
export async function getRelatedBlogPosts(postId: string, categoryId: string, limit = 3) {
  return sanityFetch(
    `*[_type == "blogPost" && _id != $postId && category._ref == $categoryId && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...${limit}] {
      ${BLOG_POST_FIELDS}
    }`,
    { postId, categoryId },
    []
  );
}

/** All post slugs — for generateStaticParams */
export async function getAllBlogPostSlugs() {
  return sanityFetch<{ slug: { current: string } }[]>(
    `*[_type == "blogPost" && !(_id in path("drafts.**"))]{slug}`,
    undefined,
    []
  );
}

/** All category slugs — for generateStaticParams */
export async function getAllBlogCategorySlugs() {
  return sanityFetch<{ slug: { current: string } }[]>(
    `*[_type == "blogCategory"]{slug}`,
    undefined,
    []
  );
}

// ── Knowledge Hub Queries ───────────────────────────────────────────

const KNOWLEDGE_ARTICLE_FIELDS = `
  _id,
  _type,
  title,
  slug,
  category,
  excerpt,
  mainImage,
  featured,
  publishedAt,
  updatedAt,
  relatedProductCategoryHref,
  "author": author->{ name, title, bio, image, photo },
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 200)
`;

const KNOWLEDGE_ARTICLE_DETAIL_FIELDS = `
  ${KNOWLEDGE_ARTICLE_FIELDS},
  body,
  faqs,
  seoTitle,
  seoDescription,
  ogImage
`;

export async function getAllKnowledgeArticles(limit = 50, offset = 0) {
  return sanityFetch(
    `*[_type == "knowledgeArticle" && !(_id in path("drafts.**"))] | order(featured desc, publishedAt desc) [${offset}...${offset + limit}] {
      ${KNOWLEDGE_ARTICLE_FIELDS}
    }`,
    undefined,
    []
  );
}

export async function getKnowledgeArticlesByCategory(categories: string[], limit = 50) {
  return sanityFetch(
    `*[_type == "knowledgeArticle" && category in $categories && !(_id in path("drafts.**"))] | order(featured desc, publishedAt desc) [0...${limit}] {
      ${KNOWLEDGE_ARTICLE_FIELDS}
    }`,
    { categories },
    []
  );
}

export async function getFeaturedKnowledgeArticles(limit = 3) {
  return sanityFetch(
    `*[_type == "knowledgeArticle" && featured == true && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...${limit}] {
      ${KNOWLEDGE_ARTICLE_FIELDS}
    }`,
    undefined,
    []
  );
}

export async function getKnowledgeArticleBySlug(slug: string) {
  return sanityFetch(
    `*[_type == "knowledgeArticle" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
      ${KNOWLEDGE_ARTICLE_DETAIL_FIELDS}
    }`,
    { slug },
    null
  );
}

export async function getAllKnowledgeArticleSlugs() {
  return sanityFetch<{ slug: { current: string } }[]>(
    `*[_type == "knowledgeArticle" && !(_id in path("drafts.**"))]{slug}`,
    undefined,
    []
  );
}

// ── Shared Content Queries ──────────────────────────────────────────

export async function getPublishedTestimonials(limit = 6) {
  return sanityFetch(
    `*[_type == "testimonial" && !(_id in path("drafts.**"))] | order(isFeatured desc, publishedAt desc) [0...${limit}] {
      _id,
      name,
      location,
      rating,
      quote,
      productContext,
      isFeatured
    }`,
    undefined,
    []
  );
}

export async function getHomepageContent() {
  return sanityFetch(
    `*[_type == "homepageContent"][0] {
      title,
      knowledgeHeading,
      knowledgeSubheading,
      "featuredKnowledge": featuredKnowledge[]->{
        ${KNOWLEDGE_ARTICLE_FIELDS}
      },
      "featuredTestimonials": featuredTestimonials[]->{
        _id,
        name,
        location,
        rating,
        quote,
        productContext,
        isFeatured
      },
      updatedAt
    }`,
    undefined,
    null
  );
}

export async function getStoreLocations() {
  return sanityFetch(
    `*[_type == "storeLocation" && isActive != false && !(_id in path("drafts.**"))] | order(isPrimary desc, sortOrder asc, title asc) {
      _id,
      title,
      slug,
      image,
      addressLine1,
      addressLine2,
      city,
      region,
      postalCode,
      country,
      phone,
      email,
      mapUrl,
      hours,
      isPrimary,
      sortOrder
    }`,
    undefined,
    []
  );
}

export async function getSanityExpertProfiles() {
  return sanityFetch(
    `*[_type == "expertProfile" && isActive != false && !(_id in path("drafts.**"))] | order(sortOrder asc, name asc) {
      _id,
      name,
      title,
      specialty,
      photo,
      bio,
      personalQuote,
      credentials,
      languages,
      yearsExperience
    }`,
    undefined,
    []
  );
}

export async function getSiteSettings() {
  return sanityFetch(
    `*[_type == "siteSettings"][0] {
      supportPhone,
      supportEmail,
      whatsappNumber,
      consultationDisclaimer,
      gemstoneDisclaimer
    }`,
    undefined,
    null
  );
}
