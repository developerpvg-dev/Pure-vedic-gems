import Image from 'next/image';
import Link from 'next/link';
import type { StaticKnowledgeGuide } from '@/lib/constants/static-knowledge-guides';

const sections = [
  { id: 'what-is-it', label: 'What is it' },
  { id: 'vedic-significance', label: 'Vedic significance' },
  { id: 'benefits', label: 'Benefits' },
  { id: 'who-should-wear', label: 'Who should wear' },
  { id: 'how-to-wear', label: 'How to wear' },
  { id: 'quality-pricing', label: 'Quality and pricing' },
  { id: 'expert-corner', label: "Expert's corner" },
  { id: 'faqs', label: 'FAQs' },
] as const;

export function getStaticGuideSchemas(guide: StaticKnowledgeGuide, pathname: string, siteUrl: string) {
  const pageUrl = `${siteUrl}${pathname}`;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    image: `${siteUrl}${guide.heroImage}`,
    datePublished: guide.updatedAt,
    dateModified: guide.updatedAt,
    author: { '@type': 'Organization', name: 'PureVedicGems' },
    publisher: { '@type': 'Organization', name: 'PureVedicGems', url: siteUrl },
    mainEntityOfPage: pageUrl,
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Knowledge', item: `${siteUrl}/knowledge` },
      { '@type': 'ListItem', position: 3, name: guide.parentLabel, item: `${siteUrl}${guide.parentHref}` },
      { '@type': 'ListItem', position: 4, name: guide.shortTitle, item: pageUrl },
    ],
  };

  return [articleSchema, faqSchema, breadcrumbSchema];
}

export function StaticGuideArticle({ guide, pathname }: { guide: StaticKnowledgeGuide; pathname: string }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';
  const schemas = getStaticGuideSchemas(guide, pathname, siteUrl);

  return (
    <main className="min-h-screen bg-[#FDFAF5] px-4 pb-20 pt-32.5 md:px-8">
      <article className="mx-auto max-w-295">
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[12px] text-[#6B5B4E]">
          <Link href="/" className="hover:text-[#7A1515]">Home</Link>
          <span>/</span>
          <Link href="/knowledge" className="hover:text-[#7A1515]">Knowledge</Link>
          <span>/</span>
          <Link href={guide.parentHref} className="hover:text-[#7A1515]">{guide.parentLabel}</Link>
          <span>/</span>
          <span className="text-[#4D0A0A]">{guide.shortTitle}</span>
        </nav>

        <header className="grid gap-8 border-b border-[#DDD0B4] pb-10 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#B8861E]">{guide.eyebrow}</p>
            <h1 className="max-w-4xl text-[#4D0A0A]" style={{ fontSize: 'clamp(34px, 5vw, 64px)', lineHeight: 1.02 }}>
              {guide.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#6B5B4E] md:text-lg">{guide.description}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#6B5B4E]">
              <span>{guide.readingTime} min read</span>
              <span>Updated {guide.updatedAt}</span>
              <span>Static guide</span>
            </div>
          </div>

          <div className="relative aspect-4/3 overflow-hidden border border-[#DDD0B4] bg-white">
            <Image
              src={guide.heroImage}
              alt={guide.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 420px"
              priority
            />
          </div>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {guide.stats.map((stat) => (
            <div key={stat.label} className="border border-[#DDD0B4] bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#B8861E]">{stat.label}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#1C1C1C]">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-32 border border-[#DDD0B4] bg-white p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#B8861E]">In this guide</p>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="block text-xs leading-5 text-[#6B5B4E] hover:text-[#7A1515]">
                    {section.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div className="space-y-10">
            <section id="what-is-it" className="scroll-mt-32">
              <h2 className="text-3xl font-black text-[#4D0A0A]">What is it</h2>
              <p className="mt-4 text-base leading-8 text-[#6B5B4E]">{guide.intro}</p>
            </section>

            <section id="vedic-significance" className="scroll-mt-32 border-l-4 border-[#B8861E] bg-white p-6">
              <h2 className="text-3xl font-black text-[#4D0A0A]">Vedic significance</h2>
              <p className="mt-4 text-base leading-8 text-[#6B5B4E]">{guide.vedicSignificance}</p>
            </section>

            <section id="benefits" className="scroll-mt-32">
              <h2 className="text-3xl font-black text-[#4D0A0A]">Benefits</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {guide.benefits.map((benefit) => (
                  <div key={benefit} className="border border-[#DDD0B4] bg-white p-5 text-sm leading-7 text-[#6B5B4E]">
                    {benefit}
                  </div>
                ))}
              </div>
            </section>

            <section id="who-should-wear" className="scroll-mt-32">
              <h2 className="text-3xl font-black text-[#4D0A0A]">Who should wear</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {guide.whoShouldWear.map((section) => (
                  <div key={section.title} className="border-t-2 border-[#7A1515] bg-white p-5">
                    <h3 className="text-base font-black text-[#1C1C1C]">{section.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#6B5B4E]">{section.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="how-to-wear" className="scroll-mt-32">
              <h2 className="text-3xl font-black text-[#4D0A0A]">How to wear</h2>
              <div className="mt-5 space-y-4">
                {guide.howToWear.map((step, index) => (
                  <div key={step.title} className="grid gap-4 border border-[#DDD0B4] bg-white p-5 sm:grid-cols-[44px_1fr]">
                    <span className="grid h-11 w-11 place-items-center bg-[#7A1515] text-sm font-black text-white">{index + 1}</span>
                    <div>
                      <h3 className="text-base font-black text-[#1C1C1C]">{step.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#6B5B4E]">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="quality-pricing" className="scroll-mt-32">
              <h2 className="text-3xl font-black text-[#4D0A0A]">Quality and pricing</h2>
              <div className="mt-5 grid gap-3">
                {guide.qualityPricing.map((item) => (
                  <p key={item} className="border-b border-[#DDD0B4] pb-3 text-sm leading-7 text-[#6B5B4E]">
                    {item}
                  </p>
                ))}
              </div>
            </section>

            <section id="expert-corner" className="scroll-mt-32 bg-[#4D0A0A] p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D4A843]">Expert&apos;s Corner</p>
              <h2 className="mt-3 text-3xl font-black">PureVedicGems buying note</h2>
              <p className="mt-4 text-base leading-8 text-white/80">{guide.expertCorner}</p>
            </section>

            <section id="faqs" className="scroll-mt-32">
              <h2 className="text-3xl font-black text-[#4D0A0A]">Frequently asked questions</h2>
              <div className="mt-5 space-y-3">
                {guide.faqs.map((faq) => (
                  <details key={faq.question} className="border border-[#DDD0B4] bg-white p-5">
                    <summary className="cursor-pointer text-sm font-black text-[#1C1C1C]">{faq.question}</summary>
                    <p className="mt-3 text-sm leading-7 text-[#6B5B4E]">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            <section className="grid gap-4 border border-[#DDD0B4] bg-white p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-2xl font-black text-[#4D0A0A]">Shop with this guide open</h2>
                <p className="mt-2 text-sm leading-7 text-[#6B5B4E]">
                  Keep certificate, tag number, treatment, origin, and configuration eligibility ready while shortlisting products.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={guide.shopHref} className="bg-[#7A1515] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white">
                  Shop Related Products
                </Link>
                <Link href="/consultation" className="border border-[#7A1515] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#7A1515]">
                  Ask an Expert
                </Link>
              </div>
            </section>

            <p className="text-xs leading-6 text-[#6B5B4E]">
              This guide is educational. Gemstone and Rudraksha traditions are spiritual practices and should not be treated as medical, legal, financial, or emergency advice.
            </p>
          </div>
        </div>
      </article>

      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </main>
  );
}