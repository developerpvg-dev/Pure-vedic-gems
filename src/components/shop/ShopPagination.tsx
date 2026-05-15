import Link from 'next/link';

function pageWindow(page: number, totalPages: number) {
  return Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (pageNumber) => pageNumber === 1 || pageNumber === totalPages || Math.abs(pageNumber - page) <= 2
  );
}

export function ShopPagination({
  page,
  totalPages,
  searchParams,
  basePath,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string>;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(pageNumber));
    return `${basePath}?${params.toString()}`;
  };

  const pages = pageWindow(page, totalPages);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Product pagination">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`rounded-md border border-[var(--pvg-border)] px-4 py-2 text-[13px] font-medium transition ${
          page <= 1
            ? 'pointer-events-none opacity-40'
            : 'text-[var(--pvg-primary)] hover:border-[var(--pvg-primary)] hover:bg-brand-gold-light'
        }`}
      >
        Previous
      </Link>
      {pages.map((pageNumber, index) => {
        const previous = pages[index - 1];
        return (
          <span key={pageNumber} className="flex items-center gap-2">
            {previous && pageNumber - previous > 1 ? <span className="text-[var(--pvg-muted)]">...</span> : null}
            <Link
              href={buildHref(pageNumber)}
              aria-current={pageNumber === page ? 'page' : undefined}
              className="flex h-9 w-9 items-center justify-center rounded-md border text-[13px] font-medium transition hover:border-[var(--pvg-primary)]"
              style={{
                borderColor: pageNumber === page ? 'var(--pvg-primary)' : 'var(--pvg-border)',
                background: pageNumber === page ? 'var(--pvg-primary)' : 'transparent',
                color: pageNumber === page ? 'var(--pvg-bg)' : 'var(--pvg-text)',
              }}
            >
              {pageNumber}
            </Link>
          </span>
        );
      })}
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`rounded-md border border-[var(--pvg-border)] px-4 py-2 text-[13px] font-medium transition ${
          page >= totalPages
            ? 'pointer-events-none opacity-40'
            : 'text-[var(--pvg-primary)] hover:border-[var(--pvg-primary)] hover:bg-brand-gold-light'
        }`}
      >
        Next
      </Link>
    </nav>
  );
}