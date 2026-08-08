import Image from 'next/image';
import Link from 'next/link';
import { Clock, ArrowRight, Tag } from 'lucide-react';
import { urlFor } from '@/lib/sanity/client';
import type { SanityBlogPost } from '@/lib/types/blog';

export function BlogPostCard({ post }: { post: SanityBlogPost }) {
  const imageUrl = post.mainImage
    ? urlFor(post.mainImage).width(960).height(540).fit('crop').quality(80).auto('format').url()
    : null;

  return (
    <Link href={`/blog/${post.slug?.current}`} className="pvg-blog-card group">
      {imageUrl && (
        <div className="pvg-blog-card-image">
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="pvg-blog-card-body">
        {post.category && (
          <span className="pvg-blog-card-tag">
            <Tag className="h-3 w-3" aria-hidden="true" />
            {post.category.title}
          </span>
        )}
        <h3 className="pvg-blog-card-title line-clamp-2">{post.title}</h3>
        {post.excerpt && <p className="pvg-blog-card-excerpt line-clamp-2">{post.excerpt}</p>}
        <div className="pvg-blog-card-meta">
          <div className="flex flex-wrap items-center gap-3">
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
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {post.estimatedReadingTime} min read
              </span>
            )}
          </div>
          <span className="pvg-blog-card-read">
            Read <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function BlogFeaturedPost({ post }: { post: SanityBlogPost }) {
  const imageUrl = post.mainImage
    ? urlFor(post.mainImage).width(1200).height(675).fit('crop').quality(85).auto('format').url()
    : null;

  return (
    <Link href={`/blog/${post.slug?.current}`} className="pvg-blog-card group">
      <div className="grid gap-0 md:grid-cols-2">
        {imageUrl && (
          <div className="relative aspect-video overflow-hidden bg-[#ece5db] md:aspect-auto md:min-h-[18rem]">
            <Image
              src={imageUrl}
              alt={post.title}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        )}
        <div className="flex flex-col justify-center p-5 md:p-7">
          <span className="pvg-blog-featured-badge">Featured</span>
          {post.category && (
            <span className="mb-2 text-xs font-bold uppercase tracking-wide text-[#7a1515]">
              {post.category.title}
            </span>
          )}
          <h2 className="pvg-blog-card-title text-2xl md:text-3xl">{post.title}</h2>
          {post.excerpt && <p className="pvg-blog-card-excerpt mt-3 line-clamp-3">{post.excerpt}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[#6b5b4e]">
            {post.author?.name && <span>By {post.author.name}</span>}
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
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {post.estimatedReadingTime} min
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
