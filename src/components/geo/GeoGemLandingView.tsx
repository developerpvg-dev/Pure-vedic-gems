import Image from 'next/image';
import Link from 'next/link';
import type { GeoGemLanding } from '@/lib/constants/geo-gem-landings';

export function GeoGemLandingView({ page }: { page: GeoGemLanding }) {
  const faqs = page.faqs.map((f) => ({
    question: f.question.replace(/:\?$/, '?').replace(/\?\?$/, '?'),
    answer: f.answer,
  }));

  // Body often repeats the H1 as <strong> or <h1> at the top — hero already shows it.
  const bodyHtml = page.bodyHtml
    .replace(/^<strong>[\s\S]*?<\/strong>\s*/i, '')
    .replace(/^<h1>[\s\S]*?<\/h1>\s*/i, '')
    .replace(/^<p>\s*<\/p>\s*/i, '');

  return (
    <main className="geo-gem-page">
      <div className="geo-gem-hero">
        <div className="geo-gem-hero-inner">
          <p className="geo-gem-region">
            {page.gemLabel} · {page.region}
          </p>
          <h1>{page.h1}</h1>
          <p className="geo-gem-lead">{page.description}</p>
          <div className="geo-gem-cta-row">
            <Link href={page.shopPath} className="geo-gem-cta geo-gem-cta-primary">
              Shop {page.gemLabel}
            </Link>
            <Link href="/consultation" className="geo-gem-cta geo-gem-cta-ghost">
              Book consultation
            </Link>
            <Link href={page.qualityPath} className="geo-gem-cta geo-gem-cta-ghost">
              Quality guide
            </Link>
          </div>
        </div>
        {page.ogImage ? (
          <div className="geo-gem-hero-media">
            <Image
              src={page.ogImage}
              alt={page.h1}
              width={960}
              height={640}
              className="geo-gem-hero-img"
              priority
            />
          </div>
        ) : null}
      </div>

      <article className="geo-gem-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

      {faqs.length > 0 ? (
        <section className="geo-gem-faq" aria-labelledby="geo-faq-heading">
          <h2 id="geo-faq-heading">Frequently asked questions</h2>
          <div className="geo-gem-faq-list">
            {faqs.map((f) => (
              <details key={f.question} className="geo-gem-faq-item">
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="geo-gem-bottom-cta" aria-label="Next steps">
        <h2>Get certified {page.gemLabel}</h2>
        <p>
          Natural, laboratory-backed stones with Vedic guidance for buyers in{' '}
          {page.region} and worldwide. Heritage expertise since 1937.
        </p>
        <div className="geo-gem-cta-row">
          <Link href={page.shopPath} className="geo-gem-cta geo-gem-cta-primary">
            View collection
          </Link>
          <Link href="/gems-recommendations" className="geo-gem-cta geo-gem-cta-ghost">
            Remedies recommendation
          </Link>
        </div>
      </section>
    </main>
  );
}
