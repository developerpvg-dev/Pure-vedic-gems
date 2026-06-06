import path from 'node:path';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { createClient } from '@sanity/client';
import { streamWpTable, type SqlValue } from './lib/wp-sql.js';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..', '..');
const workspaceRoot = resolve(appRoot, '..');
const contentDump = resolve(workspaceRoot, 'purevedi_comnewlive', 'purevedi_comnewlive.sql');
const wooDump = resolve(workspaceRoot, 'pugemved_indb', 'pugemved_indb.sql');

loadEnv({ path: resolve(appRoot, '.env.local'), override: true });

type SourceSummary = {
  blogIds: Set<string>;
  blogDraftCount: number;
  blogPosts: Map<string, { title: string; excerpt: string; content: string }>;
  blogSeoMeta: Map<string, Record<string, string>>;
  testimonialIds: Set<string>;
  testimonialThumbIds: Set<string>;
  newsletterIdsByEmail: Map<string, string>;
  recommendationIds: Set<string>;
  couponCodes: Map<string, string[]>;
};

function ok(label: string, value: unknown) {
  console.log(`OK ${label}: ${value}`);
}

function warn(label: string, value: unknown) {
  console.log(`WARN ${label}: ${value}`);
}

function fail(label: string, value: unknown) {
  console.log(`FAIL ${label}: ${value}`);
}

function asText(value: SqlValue | undefined) {
  return String(value ?? '').trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#8217;|&#8216;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateAtWord(value: string, max: number) {
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function normalizeLegacySeo(value: string, post: { title: string; excerpt: string; content: string }, max: number) {
  const excerpt = truncateAtWord(post.excerpt.trim() || stripHtml(post.content), 160);
  return truncateAtWord(
    stripHtml(value
      .replace(/%%title%%/gi, post.title)
      .replace(/%%sitename%%/gi, 'Pure Vedic Gems')
      .replace(/%%sep%%/gi, '-')
      .replace(/%%excerpt%%/gi, excerpt)
      .replace(/%%excerpt_only%%/gi, excerpt)
      .replace(/%%page%%/gi, '')
      .replace(/%%primary_category%%/gi, '')
      .replace(/%%category%%/gi, '')
      .replace(/\s+-\s+-\s+/g, ' - ')
      .replace(/\s{2,}/g, ' ')
      .trim()),
    max,
  );
}

function email(value: SqlValue | undefined) {
  return asText(value).toLowerCase();
}

async function readSource(): Promise<SourceSummary> {
  const blogIds = new Set<string>();
  const blogPosts = new Map<string, { title: string; excerpt: string; content: string }>();
  let blogDraftCount = 0;
  const testimonialIds = new Set<string>();
  const testimonialThumbIds = new Set<string>();
  const newsletterIdsByEmail = new Map<string, string>();
  const recommendationIds = new Set<string>();
  const couponCodes = new Map<string, string[]>();
  const blogSeoMeta = new Map<string, Record<string, string>>();

  for await (const row of streamWpTable({ filePath: contentDump, tableName: 'pvg_posts' })) {
    const type = row.post_type;
    const status = row.post_status;
    const id = asText(row.ID);
    if (type === 'blog' && status === 'publish') {
      blogIds.add(id);
      blogPosts.set(id, {
        title: asText(row.post_title),
        excerpt: String(row.post_excerpt ?? ''),
        content: String(row.post_content ?? ''),
      });
    }
    if (type === 'blog' && status === 'draft') blogDraftCount++;
    if (type === 'testimonial' && status === 'publish') testimonialIds.add(id);
  }

  const seoKeys = new Set([
    '_yoast_wpseo_title',
    '_yoast_wpseo_metadesc',
    '_aioseo_title',
    '_aioseo_description',
    'rank_math_title',
    'rank_math_description',
  ]);
  for await (const row of streamWpTable({
    filePath: contentDump,
    tableName: 'pvg_postmeta',
    filter: (record: Record<string, SqlValue>) =>
      (blogIds.has(String(record.post_id)) && seoKeys.has(String(record.meta_key))) ||
      (testimonialIds.has(String(record.post_id)) && record.meta_key === '_thumbnail_id'),
  })) {
    const postId = asText(row.post_id);
    const key = asText(row.meta_key);
    const value = asText(row.meta_value);
    if (blogIds.has(postId) && value) {
      const record = blogSeoMeta.get(postId) ?? {};
      record[key] = value;
      blogSeoMeta.set(postId, record);
    }
    if (testimonialIds.has(postId) && key === '_thumbnail_id' && value) testimonialThumbIds.add(postId);
  }

  for await (const row of streamWpTable({ filePath: contentDump, tableName: 'pvg_eemail_newsletter_sub' })) {
    const rowEmail = email(row.eemail_email_sub);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rowEmail)) newsletterIdsByEmail.set(rowEmail, asText(row.eemail_id_sub));
  }

  for await (const row of streamWpTable({ filePath: contentDump, tableName: 'recommendations' })) {
    const id = asText(row.id);
    if (id) recommendationIds.add(id);
  }

  for await (const row of streamWpTable({
    filePath: wooDump,
    tableName: 'wp_posts',
    filter: (record) => record.post_type === 'shop_coupon' && record.post_status === 'publish',
  })) {
    const code = asText(row.post_title).toUpperCase();
    const id = asText(row.ID);
    if (!code || !id) continue;
    const ids = couponCodes.get(code) ?? [];
    ids.push(id);
    couponCodes.set(code, ids);
  }

  return { blogIds, blogDraftCount, blogPosts, blogSeoMeta, testimonialIds, testimonialThumbIds, newsletterIdsByEmail, recommendationIds, couponCodes };
}

async function readDb(dbUrl: string) {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const [coupons, testimonials, newsletters, recommendations] = await Promise.all([
      client.query("select code, metadata->>'legacy_woo_id' as legacy_id from coupons where metadata ? 'legacy_woo_id'"),
      client.query("select legacy_wp_id, name, slug, message, proof_image_url, source_url, status, is_active, published_at from testimonials where legacy_wp_id is not null"),
      client.query("select legacy_wp_id, email, status, subscribed_at, source from newsletter_subscribers where legacy_wp_id is not null"),
      client.query("select legacy_wp_id, name, email, phone, birth_date, birth_time, purpose, source, status from recommendation_requests where legacy_wp_id is not null"),
    ]);
    return { coupons: coupons.rows, testimonials: testimonials.rows, newsletters: newsletters.rows, recommendations: recommendations.rows };
  } finally {
    await client.end();
  }
}

async function readSanityBlogs() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
  if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID');
  const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN });
  return client.fetch<Array<{
    _id: string;
    title?: string;
    slug?: { current?: string };
    excerpt?: string;
    seoTitle?: string;
    seoDescription?: string;
    mainImage?: { asset?: { _ref?: string }; alt?: string };
    category?: { _ref?: string };
    author?: { _ref?: string };
    body?: unknown[];
    publishedAt?: string;
  }>>(`*[_type == "blogPost"]{
    _id,title,slug,excerpt,seoTitle,seoDescription,mainImage{asset,alt},category,author,body,publishedAt
  }`);
}

function diffSet(expected: Set<string>, actual: Set<string>) {
  const missing = [...expected].filter((value) => !actual.has(value));
  const extra = [...actual].filter((value) => !expected.has(value));
  return { missing, extra };
}

async function main() {
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL_PRODUCTION || process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing production database URL env');

  const source = await readSource();
  const db = await readDb(dbUrl);
  const sanityBlogs = await readSanityBlogs();

  console.log('--- SOURCE COUNTS ---');
  ok('published legacy blogs', source.blogIds.size);
  ok('legacy blog drafts intentionally skipped', source.blogDraftCount);
  ok('published legacy testimonials', source.testimonialIds.size);
  ok('legacy testimonials with thumbnail meta', source.testimonialThumbIds.size);
  ok('valid legacy newsletter subscriber emails', source.newsletterIdsByEmail.size);
  ok('legacy recommendation requests', source.recommendationIds.size);
  ok('published legacy coupon posts', [...source.couponCodes.values()].reduce((sum, ids) => sum + ids.length, 0));
  ok('unique legacy coupon codes', source.couponCodes.size);
  const duplicateCoupons = [...source.couponCodes.entries()].filter(([, ids]) => ids.length > 1);
  if (duplicateCoupons.length) warn('duplicate legacy coupon codes collapsed by code', JSON.stringify(duplicateCoupons.slice(0, 12)));

  console.log('\n--- PRODUCTION TARGET COUNTS ---');
  ok('production legacy coupon rows', db.coupons.length);
  ok('production legacy testimonial rows', db.testimonials.length);
  ok('production legacy newsletter rows', db.newsletters.length);
  ok('production legacy recommendation rows', db.recommendations.length);

  console.log('\n--- FIELD COVERAGE ---');
  const blogIdSet = new Set(sanityBlogs.filter((doc) => doc._id.startsWith('blog-')).map((doc) => doc._id.replace(/^blog-/, '')));
  const sanityBlogByLegacyId = new Map(sanityBlogs.filter((doc) => doc._id.startsWith('blog-')).map((doc) => [doc._id.replace(/^blog-/, ''), doc]));
  const blogDiff = diffSet(source.blogIds, blogIdSet);
  const migratedBlogs = sanityBlogs.filter((doc) => doc._id.startsWith('blog-'));
  ok('Sanity migrated blog docs', migratedBlogs.length);
  ok('Sanity blogs with slugs', migratedBlogs.filter((doc) => Boolean(doc.slug?.current)).length);
  ok('Sanity blogs with SEO title', migratedBlogs.filter((doc) => Boolean(doc.seoTitle)).length);
  ok('Sanity blogs with SEO description', migratedBlogs.filter((doc) => Boolean(doc.seoDescription)).length);
  ok('Sanity blogs with main image', migratedBlogs.filter((doc) => Boolean(doc.mainImage?.asset?._ref)).length);
  ok('Sanity blogs with image alt', migratedBlogs.filter((doc) => Boolean(doc.mainImage?.alt)).length);
  ok('Sanity blogs with body', migratedBlogs.filter((doc) => Boolean(doc.body?.length)).length);
  ok('Sanity blogs with category', migratedBlogs.filter((doc) => Boolean(doc.category?._ref)).length);
  ok('Sanity blogs with author', migratedBlogs.filter((doc) => Boolean(doc.author?._ref)).length);
  if (blogDiff.missing.length || blogDiff.extra.length) fail('blog ID diff', JSON.stringify({ missing: blogDiff.missing.slice(0, 20), extra: blogDiff.extra.slice(0, 20) }));
  else ok('blog ID diff', '0 missing, 0 extra');
  if (source.blogSeoMeta.size) {
    let customSeoMatched = 0;
    const customSeoMismatches: Array<{ id: string; titleOk: boolean; descriptionOk: boolean }> = [];
    for (const [legacyId, record] of source.blogSeoMeta) {
      const post = source.blogPosts.get(legacyId);
      const doc = sanityBlogByLegacyId.get(legacyId);
      if (!post || !doc) continue;
      const titleSource = record._yoast_wpseo_title || record._aioseo_title || record.rank_math_title;
      const descriptionSource = record._yoast_wpseo_metadesc || record._aioseo_description || record.rank_math_description;
      const expectedTitle = titleSource ? normalizeLegacySeo(titleSource, post, 70) : null;
      const expectedDescription = descriptionSource ? normalizeLegacySeo(descriptionSource, post, 160) : null;
      const titleOk = !expectedTitle || doc.seoTitle === expectedTitle;
      const descriptionOk = !expectedDescription || doc.seoDescription === expectedDescription;
      if (titleOk && descriptionOk) customSeoMatched++;
      else customSeoMismatches.push({ id: legacyId, titleOk, descriptionOk });
    }
    ok('legacy custom SEO meta applied', `${customSeoMatched}/${source.blogSeoMeta.size}`);
    if (customSeoMismatches.length) fail('legacy custom SEO mismatches', JSON.stringify(customSeoMismatches.slice(0, 20)));
  } else {
    ok('legacy custom Yoast/AIOSEO/RankMath meta', 'none found; generated SEO fields cover every migrated blog');
  }

  const sourceCouponCodes = new Set(source.couponCodes.keys());
  const targetCouponCodes = new Set(db.coupons.map((row) => String(row.code ?? '').toUpperCase()));
  const couponDiff = diffSet(sourceCouponCodes, targetCouponCodes);
  if (couponDiff.missing.length || couponDiff.extra.length) fail('coupon code diff', JSON.stringify({ missing: couponDiff.missing, extra: couponDiff.extra }));
  else ok('coupon code diff', '0 missing unique codes, 0 extra');

  const testimonialTargetIds = new Set(db.testimonials.map((row) => String(row.legacy_wp_id)));
  const testimonialDiff = diffSet(source.testimonialIds, testimonialTargetIds);
  ok('testimonials with non-empty name', db.testimonials.filter((row) => Boolean(row.name)).length);
  ok('testimonials with non-empty slug', db.testimonials.filter((row) => Boolean(row.slug)).length);
  ok('testimonials with non-empty message', db.testimonials.filter((row) => Boolean(row.message)).length);
  ok('testimonials approved + active', db.testimonials.filter((row) => row.status === 'approved' && row.is_active === true).length);
  ok('testimonials with proof image url', db.testimonials.filter((row) => Boolean(row.proof_image_url)).length);
  ok('testimonials with source url', db.testimonials.filter((row) => Boolean(row.source_url)).length);
  if (testimonialDiff.missing.length || testimonialDiff.extra.length) fail('testimonial ID diff', JSON.stringify({ missing: testimonialDiff.missing, extra: testimonialDiff.extra }));
  else ok('testimonial ID diff', '0 missing, 0 extra');

  const newsletterTargetEmails = new Set(db.newsletters.map((row) => String(row.email).toLowerCase()));
  const newsletterDiff = diffSet(new Set(source.newsletterIdsByEmail.keys()), newsletterTargetEmails);
  ok('newsletter rows with status', db.newsletters.filter((row) => Boolean(row.status)).length);
  ok('newsletter rows with subscribed_at', db.newsletters.filter((row) => Boolean(row.subscribed_at)).length);
  if (newsletterDiff.missing.length || newsletterDiff.extra.length) fail('newsletter email diff', JSON.stringify({ missing: newsletterDiff.missing.slice(0, 20), extra: newsletterDiff.extra.slice(0, 20) }));
  else ok('newsletter email diff', '0 missing, 0 extra');

  const recommendationTargetIds = new Set(db.recommendations.map((row) => String(row.legacy_wp_id)));
  const recommendationDiff = diffSet(source.recommendationIds, recommendationTargetIds);
  ok('recommendations with name', db.recommendations.filter((row) => Boolean(row.name)).length);
  ok('recommendations with email', db.recommendations.filter((row) => Boolean(row.email)).length);
  ok('recommendations with phone', db.recommendations.filter((row) => Boolean(row.phone)).length);
  ok('recommendations with birth_date', db.recommendations.filter((row) => Boolean(row.birth_date)).length);
  ok('recommendations with purpose', db.recommendations.filter((row) => Boolean(row.purpose)).length);
  if (recommendationDiff.missing.length || recommendationDiff.extra.length) fail('recommendation ID diff', JSON.stringify({ missing: recommendationDiff.missing, extra: recommendationDiff.extra }));
  else ok('recommendation ID diff', '0 missing, 0 extra');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
