import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { urlFor } from '@/lib/sanity/client';
import type { SanityBlogPost } from '@/lib/types/blog';

export function BlogPostRow({ post }: { post: SanityBlogPost }) {
  const imageUrl = post.mainImage
    ? urlFor(post.mainImage).width(900).height(506).fit('crop').quality(82).auto('format').url()
    : null;
  const author = post.author?.name || 'PureVedicGems';
  const dateLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <article className="pvg-blog-row">
      <Link href={`/blog/${post.slug?.current}`} className="pvg-blog-row-link">
        <div className="pvg-blog-row-image">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover object-center"
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 360px, 420px"
            />
          ) : (
            <span className="pvg-blog-row-image-fallback" aria-hidden="true" />
          )}
        </div>
        <div className="pvg-blog-row-body">
          <h2 className="pvg-blog-row-title">{post.title}</h2>
          <p className="pvg-blog-row-meta">
            By <strong>{author}</strong>
            {dateLabel ? <time dateTime={post.publishedAt}>{dateLabel}</time> : null}
          </p>
          {post.excerpt ? <p className="pvg-blog-row-excerpt">{post.excerpt}</p> : null}
          <span className="pvg-blog-row-read">
            Read More
            <ArrowRight aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}
