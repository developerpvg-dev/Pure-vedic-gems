import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, ArrowRight, ArrowLeft, Tag } from 'lucide-react';
import { urlFor } from '@/lib/sanity/client';
import {
  getBlogPostsByCategory,
  getBlogCategoryBySlug,
  getAllBlogCategorySlugs,
  getBlogPostCountByCategory,
} from '@/lib/sanity/queries';
import type { SanityBlogPost, SanityCategory } from '@/lib/types/blog';
import type { Metadata } from 'next';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllBlogCategorySlugs();
  return (slugs ?? []).map((s) => ({ category: s.slug.current }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = (await getBlogCategoryBySlug(slug)) as SanityCategory | null;
  if (!cat) return { title: 'Category Not Found — PureVedicGems' };

  return {
    title: `${cat.title} — PureVedicGems Blog`,
    description: cat.description || `Read our latest articles about ${cat.title}.`,
  };
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { category: slug } = await params;

  const [cat, posts, totalCount] = await Promise.all([
    getBlogCategoryBySlug(slug),
    getBlogPostsByCategory(slug, 50, 0),
    getBlogPostCountByCategory(slug),
  ]);

  const category = cat as SanityCategory | null;
  if (!category) notFound();

  const allPosts = (posts ?? []) as SanityBlogPost[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-gray-500">
          <li>
            <Link href="/" className="transition hover:text-amber-700">Home</Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/blog" className="transition hover:text-amber-700">Blog</Link>
          </li>
          <li>/</li>
          <li className="font-medium text-gray-900">{category.title}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <Link
          href="/blog"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 transition hover:text-amber-900"
        >
          <ArrowLeft className="h-4 w-4" />
          All Articles
        </Link>
        <h1 className="font-heading text-3xl font-bold text-gray-900 md:text-4xl">
          {category.title}
        </h1>
        {category.description && (
          <p className="mt-2 text-lg text-gray-600">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-gray-400">
          {totalCount} article{totalCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Posts Grid */}
      {allPosts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allPosts.map((post) => {
            const imageUrl = post.mainImage
              ? urlFor(post.mainImage).width(600).height(400).quality(80).auto('format').url()
              : null;

            return (
              <Link
                key={post._id}
                href={`/blog/${post.slug?.current}`}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg"
              >
                {imageUrl && (
                  <div className="relative aspect-[3/2] overflow-hidden bg-gray-100">
                    <Image
                      src={imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    <Tag className="h-3 w-3" />
                    {category.title}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      {post.publishedAt && (
                        <time dateTime={post.publishedAt}>
                          {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </time>
                      )}
                      {post.estimatedReadingTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.estimatedReadingTime} min
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 font-medium text-amber-700 opacity-0 transition-opacity group-hover:opacity-100">
                      Read <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg text-gray-500">No articles in this category yet.</p>
          <Link
            href="/blog"
            className="mt-4 inline-flex items-center gap-1.5 text-amber-700 underline underline-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse all articles
          </Link>
        </div>
      )}
    </div>
  );
}
