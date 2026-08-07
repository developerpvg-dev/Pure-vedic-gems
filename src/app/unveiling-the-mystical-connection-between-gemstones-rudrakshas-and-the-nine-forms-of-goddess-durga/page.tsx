import type { Metadata } from 'next';
import { NavaDurgaArticleView } from '@/components/articles/NavaDurgaArticleView';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  NAVA_DURGA_FAQS,
  NAVA_DURGA_FORMS,
  NAVA_DURGA_PATH,
  NAVA_DURGA_SEO,
} from '@/lib/constants/nava-durga-article';
import {
  absoluteUrl,
  brandLogoUrl,
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
} from '@/lib/utils/seo';
import './nava-durga.css';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const base = buildMetadata({
    title: `${NAVA_DURGA_SEO.title} | PureVedicGems`,
    description: NAVA_DURGA_SEO.description,
    path: NAVA_DURGA_PATH,
    image: NAVA_DURGA_SEO.ogImage,
    type: 'article',
  });

  return {
    ...base,
    keywords: NAVA_DURGA_SEO.keywords,
    robots: { index: true, follow: true },
    openGraph: {
      ...(base.openGraph ?? {}),
      type: 'article',
      publishedTime: NAVA_DURGA_SEO.publishedAt,
      modifiedTime: NAVA_DURGA_SEO.modifiedAt,
      authors: ['Pure Vedic Gems'],
      tags: NAVA_DURGA_SEO.keywords.slice(0, 12),
    },
  };
}

export default function NavaDurgaGemstonesPage() {
  const pageUrl = absoluteUrl(NAVA_DURGA_PATH);
  const faq = faqJsonLd(NAVA_DURGA_FAQS);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: NAVA_DURGA_SEO.title,
    description: NAVA_DURGA_SEO.description,
    image: NAVA_DURGA_FORMS.map((f) => f.image),
    datePublished: NAVA_DURGA_SEO.publishedAt,
    dateModified: NAVA_DURGA_SEO.modifiedAt,
    author: { '@type': 'Organization', name: 'PureVedicGems' },
    publisher: {
      '@type': 'Organization',
      name: 'PureVedicGems',
      logo: { '@type': 'ImageObject', url: brandLogoUrl() },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    keywords: NAVA_DURGA_SEO.keywords.join(', '),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.navratna-subtitle', '.nd-card-head h2', '.nd-faq-item summary'],
    },
    about: NAVA_DURGA_FORMS.map((form) => ({
      '@type': 'Thing',
      name: form.name,
      description: `${form.name} — ${form.planet}; gemstone ${form.gemLabel}; ${form.rudrakshaLabel}`,
    })),
  };

  const schemas = [
    articleLd,
    breadcrumbJsonLd([
      { name: 'Home', href: '/' },
      { name: 'Blog', href: '/blog' },
      { name: NAVA_DURGA_SEO.title, href: NAVA_DURGA_PATH },
    ]),
    ...(faq ? [faq] : []),
  ];

  return (
    <>
      {schemas.map((data, i) => (
        <JsonLd key={i} data={data as Record<string, unknown>} />
      ))}
      <NavaDurgaArticleView />
    </>
  );
}
