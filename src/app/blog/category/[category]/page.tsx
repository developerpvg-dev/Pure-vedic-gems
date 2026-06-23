import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  getBlogPostsByCategory,
  getBlogCategoryBySlug,
  getAllBlogCategorySlugs,
  getBlogPostCountByCategory,
} from '@/lib/sanity/queries';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import type { SanityBlogPost, SanityCategory } from '@/lib/types/blog';
import type { Metadata } from 'next';
import '../../blog-page.css';

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
    <main className="pvg-blog-page font-body text-[#15110d]">
      <div className="pvg-blog-inner">
        <nav className="pvg-blog-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/blog">Blog</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{category.title}</span>
        </nav>

        <Link href="/blog" className="pvg-blog-back">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All Articles
        </Link>

        <header className="pvg-blog-hero" style={{ textAlign: 'left', marginBottom: '2rem' }}>
          <h1 className="section-title" style={{ textAlign: 'left' }}>{category.title}</h1>
          {category.description && (
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: '0.5rem 0 0', textAlign: 'left', maxWidth: '40rem' }}>
              {category.description}
            </p>
          )}
          <div className="section-rule-center" style={{ margin: '15px 0 5px', marginLeft: 0 }} aria-hidden="true" />
          <p className="pvg-blog-hero-count" style={{ textAlign: 'left' }}>
            {totalCount} article{totalCount !== 1 ? 's' : ''}
          </p>
        </header>

        {allPosts.length > 0 ? (
          <section className="pvg-blog-grid" aria-label={`${category.title} articles`}>
            {allPosts.map((post) => (
              <BlogPostCard key={post._id} post={post} />
            ))}
          </section>
        ) : (
          <div className="pvg-blog-empty">
            <p className="pvg-blog-empty-title">No articles in this category yet.</p>
            <Link href="/blog" className="pvg-blog-back mt-4 inline-flex">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Browse all articles
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
