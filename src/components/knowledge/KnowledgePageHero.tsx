import Link from 'next/link';
import type { ReactNode } from 'react';

export type KnowledgeBreadcrumb = {
  label: string;
  href?: string;
};

interface KnowledgePageHeroProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: KnowledgeBreadcrumb[];
  children?: ReactNode;
  id?: string;
}

export function KnowledgePageHero({
  title,
  subtitle,
  breadcrumbs,
  children,
  id,
}: KnowledgePageHeroProps) {
  return (
    <header className="pvg-knowledge-hero px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-1.5 text-[12px] text-[#6B5B4E]"
          >
            {breadcrumbs.map((item, index) => (
              <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {item.href ? (
                  <Link href={item.href} className="transition hover:text-[#7A1515]">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-[#4D0A0A]">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}

        <div
          id={id}
          className="mx-auto max-w-4xl pb-8 pt-2 text-center sm:pt-4"
          style={{ scrollMarginTop: 'calc(var(--pvg-site-header-offset) + 0.75rem)' }}
        >
          <h1 className="section-title">{title}</h1>
          {subtitle ? (
            <p
              className="navratna-subtitle !text-[#5a5043]"
              style={{ margin: '0.75rem auto 0', maxWidth: '42rem' }}
            >
              {subtitle}
            </p>
          ) : null}
          <div
            className="section-rule-center"
            style={{ margin: '15px auto 5px' }}
            aria-hidden="true"
          />
          {children}
        </div>
      </div>
    </header>
  );
}
