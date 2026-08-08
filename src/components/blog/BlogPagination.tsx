import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const BLOG_POSTS_PER_PAGE = 24;

/** Page numbers to show, with null as an ellipsis gap. */
export function blogPageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1, current - 2, current + 2]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  for (const p of sorted) {
    if (out.length && p - (out[out.length - 1] as number) > 1) out.push(null);
    out.push(p);
  }
  return out;
}

export function BlogPagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const href = (page: number) => (page <= 1 ? basePath : `${basePath}?page=${page}`);

  return (
    <nav className="pvg-blog-pagination" aria-label="Blog pagination">
      {currentPage > 1 ? (
        <Link href={href(currentPage - 1)} className="pvg-blog-page-btn" aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
      {blogPageWindow(currentPage, totalPages).map((pageNumber, i) =>
        pageNumber == null ? (
          <span key={`gap-${i}`} className="pvg-blog-page-gap" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={pageNumber}
            href={href(pageNumber)}
            aria-current={pageNumber === currentPage ? 'page' : undefined}
            className={`pvg-blog-page-btn${pageNumber === currentPage ? ' pvg-blog-page-btn--active' : ''}`}
          >
            {pageNumber}
          </Link>
        )
      )}
      {currentPage < totalPages ? (
        <Link href={href(currentPage + 1)} className="pvg-blog-page-btn" aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}
