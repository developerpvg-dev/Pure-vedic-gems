import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface AccountPageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
  centered?: boolean;
}

export function AccountPageHeader({
  title,
  subtitle,
  eyebrow,
  backHref = '/account',
  backLabel = 'Back to Account',
  action,
  centered = false,
}: AccountPageHeaderProps) {
  if (centered) {
    return (
      <header className="pvg-account-hero">
        {eyebrow ? <p className="pvg-account-hero-eyebrow">{eyebrow}</p> : null}
        <h1 className="section-title">{title}</h1>
        {subtitle ? (
          <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: '0.5rem auto 0', maxWidth: '36rem' }}>
            {subtitle}
          </p>
        ) : null}
        <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
      </header>
    );
  }

  return (
    <header>
      {backHref ? (
        <Link href={backHref} className="pvg-account-back">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      ) : null}
      <div className={action ? 'pvg-account-header-row' : undefined}>
        <div>
          {eyebrow ? <p className="pvg-account-hero-eyebrow">{eyebrow}</p> : null}
          <h1 className="section-title" style={{ textAlign: 'left' }}>
            {title}
          </h1>
          {subtitle ? (
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: '0.5rem 0 0', textAlign: 'left', maxWidth: '40rem' }}>
              {subtitle}
            </p>
          ) : null}
          <div className="section-rule-center" style={{ margin: '15px 0 5px', marginLeft: 0 }} aria-hidden="true" />
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
