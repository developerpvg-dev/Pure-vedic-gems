import type { SanityClient } from '@sanity/client';
import { getSiteUrl } from '@/lib/utils/seo';
import {
  htmlToApproxMarkdown,
  isImageBlock,
  markdownToPortableText,
  type PtImageBlock,
  type PtNode,
} from './markdown-to-portable-text';

export type BabyLoveWebhookPayload = {
  id: number | string;
  title: string;
  slug: string;
  metaDescription?: string;
  content_markdown?: string;
  content_html?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  featureImageEnabled?: boolean;
  createdAt?: string;
  keywords?: string | string[];
  faqJsonLd?: unknown;
  languageCode?: string;
  lang?: string;
};

export type PublishResult =
  | { ok: true; documentId: string; slug: string; link: string; created: boolean }
  | { ok: false; error: string; status?: number };

const DEFAULT_AUTHOR_ID = 'author-pvg-editorial';
const DEFAULT_CATEGORY_ID = 'blog-cat-astrology';

export function articleDocumentId(id: number | string): string {
  return `blg-article-${id}`;
}

export function parseBabyLovePayload(body: unknown): BabyLoveWebhookPayload | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  const id = o.id;
  const title = typeof o.title === 'string' ? o.title.trim() : '';
  const slugRaw = typeof o.slug === 'string' ? o.slug.trim() : '';
  if (id === undefined || id === null || id === '' || !title || !slugRaw) return null;
  return {
    id: id as number | string,
    title,
    slug: slugify(slugRaw),
    metaDescription: typeof o.metaDescription === 'string' ? o.metaDescription : undefined,
    content_markdown: typeof o.content_markdown === 'string' ? o.content_markdown : undefined,
    content_html: typeof o.content_html === 'string' ? o.content_html : undefined,
    heroImageUrl: typeof o.heroImageUrl === 'string' ? o.heroImageUrl : undefined,
    heroImageAlt: typeof o.heroImageAlt === 'string' ? o.heroImageAlt : undefined,
    featureImageEnabled: o.featureImageEnabled !== false,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : undefined,
    keywords: Array.isArray(o.keywords)
      ? o.keywords.filter((k): k is string => typeof k === 'string')
      : typeof o.keywords === 'string'
        ? o.keywords
        : undefined,
    faqJsonLd: o.faqJsonLd,
    languageCode: typeof o.languageCode === 'string' ? o.languageCode : undefined,
    lang: typeof o.lang === 'string' ? o.lang : undefined,
  };
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 96) || 'post'
  );
}

export function extractFaqs(faqJsonLd: unknown): Array<{ question: string; answer: string }> {
  if (!faqJsonLd || typeof faqJsonLd !== 'object') return [];
  const main = (faqJsonLd as { mainEntity?: unknown }).mainEntity;
  const entities = Array.isArray(main) ? main : main ? [main] : [];
  const out: Array<{ question: string; answer: string }> = [];
  for (const item of entities) {
    if (!item || typeof item !== 'object') continue;
    const q = item as {
      name?: unknown;
      acceptedAnswer?: { text?: unknown } | unknown;
    };
    const question = typeof q.name === 'string' ? stripTags(q.name).trim() : '';
    const answerRaw =
      q.acceptedAnswer && typeof q.acceptedAnswer === 'object'
        ? (q.acceptedAnswer as { text?: unknown }).text
        : undefined;
    const answer = typeof answerRaw === 'string' ? stripTags(answerRaw).trim() : '';
    if (question && answer) out.push({ question, answer });
  }
  return out;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function deriveExcerpt(meta: string | undefined, markdown: string): string {
  const base = (meta && meta.trim()) || stripTags(markdown).slice(0, 400);
  if (base.length <= 220) return base;
  const cut = base.slice(0, 217);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 120 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

async function uploadImage(
  client: SanityClient,
  url: string,
  filenameHint?: string,
): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(45000), redirect: 'follow' });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 200) return null;
    const fromUrl = decodeURIComponent(url.split('/').pop() || 'image.jpg').split('?')[0];
    const filename = filenameHint || fromUrl || 'image.jpg';
    const asset = await client.assets.upload('image', buffer, { filename, contentType });
    return asset._id;
  } catch {
    return null;
  }
}

async function resolveBodyImages(
  client: SanityClient,
  blocks: PtNode[],
): Promise<{ body: Record<string, unknown>[]; firstInlineAsset: string | null; firstAlt?: string }> {
  const body: Record<string, unknown>[] = [];
  let firstInlineAsset: string | null = null;
  let firstAlt: string | undefined;
  for (const node of blocks) {
    if (!isImageBlock(node)) {
      body.push(node as unknown as Record<string, unknown>);
      continue;
    }
    const img = node as PtImageBlock;
    const assetId = await uploadImage(client, img._srcUrl);
    if (!assetId) continue;
    if (!firstInlineAsset) {
      firstInlineAsset = assetId;
      firstAlt = img.alt;
    }
    body.push({
      _type: 'imageBlock',
      _key: img._key,
      asset: { _type: 'reference', _ref: assetId },
      alt: img.alt,
    });
  }
  return { body, firstInlineAsset, firstAlt };
}

export async function publishBabyLoveArticle(
  client: SanityClient,
  payload: BabyLoveWebhookPayload,
  opts?: {
    authorId?: string;
    categoryId?: string;
    asDraft?: boolean;
  },
): Promise<PublishResult> {
  const docId = articleDocumentId(payload.id);
  const publishedId = docId;
  const writeId = opts?.asDraft ? `drafts.${docId}` : docId;

  const existingBySlug = await client.fetch<{ _id: string } | null>(
    `*[_type == "blogPost" && slug.current == $slug && !(_id in path("drafts.**"))][0]{ _id }`,
    { slug: payload.slug },
  );
  // Refuse slug collisions with non-BLG posts so editorial content is never overwritten.
  if (existingBySlug && existingBySlug._id !== publishedId && !existingBySlug._id.startsWith('blg-article-')) {
    return {
      ok: false,
      error: `An article with slug "${payload.slug}" already exists`,
      status: 200,
    };
  }

  const markdown =
    (payload.content_markdown && payload.content_markdown.trim()) ||
    (payload.content_html ? htmlToApproxMarkdown(payload.content_html) : '');
  if (!markdown.trim()) {
    return { ok: false, error: 'Article has no content', status: 200 };
  }

  const { blocks } = markdownToPortableText(markdown, payload.title);
  const { body, firstInlineAsset, firstAlt } = await resolveBodyImages(client, blocks);

  let mainImage: Record<string, unknown> | undefined;
  if (payload.featureImageEnabled !== false && payload.heroImageUrl) {
    const assetId = await uploadImage(client, payload.heroImageUrl, 'hero.jpg');
    if (assetId) {
      mainImage = {
        _type: 'image',
        asset: { _type: 'reference', _ref: assetId },
        alt: payload.heroImageAlt || payload.title,
      };
    }
  }
  if (!mainImage && firstInlineAsset) {
    mainImage = {
      _type: 'image',
      asset: { _type: 'reference', _ref: firstInlineAsset },
      alt: firstAlt || payload.title,
    };
  }

  const authorId = opts?.authorId || process.env.BABYLOVEGROWTH_DEFAULT_AUTHOR_ID || DEFAULT_AUTHOR_ID;
  const categoryId =
    opts?.categoryId || process.env.BABYLOVEGROWTH_DEFAULT_CATEGORY_ID || DEFAULT_CATEGORY_ID;
  const faqs = extractFaqs(payload.faqJsonLd);
  const excerpt = deriveExcerpt(payload.metaDescription, markdown);
  const publishedAt = payload.createdAt && !Number.isNaN(Date.parse(payload.createdAt))
    ? new Date(payload.createdAt).toISOString()
    : new Date().toISOString();

  const prior = await client.fetch<{ _id: string } | null>(
    `*[_id in [$id, $draftId]][0]{ _id }`,
    { id: publishedId, draftId: `drafts.${publishedId}` },
  );
  const created = !prior;

  const doc: Record<string, unknown> = {
    _id: writeId,
    _type: 'blogPost',
    title: payload.title.slice(0, 120),
    slug: { _type: 'slug', current: payload.slug },
    excerpt: excerpt.slice(0, 220),
    body,
    featured: false,
    publishedAt,
    seoTitle: payload.title.slice(0, 120),
    seoDescription: (payload.metaDescription || excerpt).slice(0, 320),
    author: { _type: 'reference', _ref: authorId },
    category: { _type: 'reference', _ref: categoryId },
  };
  if (mainImage) doc.mainImage = mainImage;
  if (faqs.length) {
    doc.faqs = faqs;
    doc.faqHeading = 'Frequently Asked Questions';
  }

  // Sanity client wants IdentifiedSanityDocumentStub; we always set `_id` above.
  await client.createOrReplace(doc as { _id: string; _type: string; [key: string]: unknown });

  const site = getSiteUrl();
  return {
    ok: true,
    documentId: writeId,
    slug: payload.slug,
    link: `${site}/blog/${payload.slug}`,
    created,
  };
}
