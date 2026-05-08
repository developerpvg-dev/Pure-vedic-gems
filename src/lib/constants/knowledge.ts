import type { PortableTextBlock, SanityKnowledgeArticle } from '@/lib/types/content';

function block(key: string, style: string, text: string): PortableTextBlock {
  return {
    _key: key,
    _type: 'block',
    style,
    markDefs: [],
    children: [{ _key: `${key}-span`, _type: 'span', text, marks: [] }],
  };
}

export const FALLBACK_KNOWLEDGE_ARTICLES: SanityKnowledgeArticle[] = [
  {
    _id: 'fallback-yellow-sapphire',
    title: 'Yellow Sapphire Buying Guide',
    slug: { _type: 'slug', current: 'yellow-sapphire-pukhraj-complete-guide' },
    category: 'Gemstone Guide',
    excerpt: 'How to evaluate Pukhraj by origin, treatment, certification, carat, quality, and suitability.',
    mainImage: 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=1200&h=800&fit=crop&q=85',
    publishedAt: '2026-04-20T00:00:00.000Z',
    estimatedReadingTime: 4,
    relatedProductCategoryHref: '/shop/yellow-sapphire',
    body: [
      block('ys-h2-1', 'h2', 'What to verify first'),
      block('ys-p-1', 'normal', 'Check natural origin, treatment disclosure, certificate details, carat weight, ratti weight, price basis, and whether the stone is suitable for loose purchase or jewellery configuration.'),
      block('ys-h2-2', 'h2', 'Quality signals'),
      block('ys-p-2', 'normal', 'Fine Pukhraj is evaluated by body color, clarity, cut, origin, treatment, and certificate confidence. Unheated stones and premium origins can command higher prices when documented properly.'),
      block('ys-h2-3', 'h2', 'Buying safety'),
      block('ys-p-3', 'normal', 'Ask for tag number, lab metadata, clear photos, return terms, and expert guidance before buying a high-value stone.'),
    ],
    faqs: [
      { question: 'Should I buy Yellow Sapphire without consultation?', answer: 'For astrological wearing, consultation is recommended because suitability depends on the person and purpose.' },
      { question: 'Which fields matter most before buying?', answer: 'Tag number, certificate lab, treatment disclosure, weight, origin, price basis, and return terms should be visible.' },
    ],
  },
  {
    _id: 'fallback-rudraksha',
    title: 'Rudraksha Buying Guide',
    slug: { _type: 'slug', current: 'rudraksha-buying-guide' },
    category: 'Rudraksha',
    excerpt: 'A practical checklist for mukhi count, origin, x-ray testing, bead quality, and wearing support.',
    mainImage: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&h=800&fit=crop&q=85',
    publishedAt: '2026-04-22T00:00:00.000Z',
    estimatedReadingTime: 3,
    relatedProductCategoryHref: '/shop/rudraksha',
    body: [
      block('rud-h2-1', 'h2', 'Core checks'),
      block('rud-p-1', 'normal', 'Review mukhi count, origin, bead size, x-ray certificate status, condition, and whether energization is included or optional.'),
      block('rud-h2-2', 'h2', 'Choosing a bead'),
      block('rud-p-2', 'normal', 'Different mukhi counts are associated with different devotional traditions. Choose based on guidance, authenticity documentation, and comfort for daily wearing.'),
      block('rud-h2-3', 'h2', 'Care and handling'),
      block('rud-p-3', 'normal', 'Keep beads dry, avoid harsh chemicals, and store them carefully. Request care instructions for malas and mounted jewellery.'),
    ],
    faqs: [
      { question: 'Is x-ray certification useful for Rudraksha?', answer: 'It helps verify bead structure and mukhi count, especially for premium or rare beads.' },
    ],
  },
  {
    _id: 'fallback-real-vs-fake',
    title: 'Real vs Treated Gemstones',
    slug: { _type: 'slug', current: 'real-vs-fake-expert-identification' },
    category: 'Buying Safety',
    excerpt: 'What certificates, origin notes, inclusions, and treatment disclosures can reveal before purchase.',
    mainImage: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=1200&h=800&fit=crop&q=85',
    publishedAt: '2026-04-24T00:00:00.000Z',
    estimatedReadingTime: 4,
    relatedProductCategoryHref: '/shop',
    body: [
      block('safe-h2-1', 'h2', 'Documentation matters'),
      block('safe-p-1', 'normal', 'A product should clearly disclose certification lab, certificate number where available, treatment status, origin notes, and tag number.'),
      block('safe-h2-2', 'h2', 'Look beyond photos'),
      block('safe-p-2', 'normal', 'Photos help with color and shape, but certificates, return terms, and expert inspection provide stronger assurance before buying high-value stones.'),
      block('safe-h2-3', 'h2', 'When unsure'),
      block('safe-p-3', 'normal', 'Use consultation before purchase for premium stones, unusual prices, or stones intended for astrological wearing.'),
    ],
    faqs: [
      { question: 'Are all treated gemstones bad?', answer: 'No. The key is clear disclosure. Treatment affects value, suitability, and customer expectations.' },
    ],
  },
  {
    _id: 'fallback-navagraha',
    title: 'Navagraha and Gemstone Connections',
    slug: { _type: 'slug', current: 'navagraha-gemstone-connections' },
    category: 'Vedic Astrology',
    excerpt: 'How the nine planetary traditions connect to classical gemstone recommendations.',
    mainImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=800&fit=crop&q=85',
    publishedAt: '2026-04-26T00:00:00.000Z',
    estimatedReadingTime: 3,
    relatedProductCategoryHref: '/shop',
    body: [
      block('nav-h2-1', 'h2', 'Traditional mapping'),
      block('nav-p-1', 'normal', 'Navaratna gemstones are traditionally associated with the nine planets. Suitability depends on individual guidance and should be handled carefully.'),
      block('nav-h2-2', 'h2', 'Product selection'),
      block('nav-p-2', 'normal', 'Use planet, rashi, origin, treatment, carat, ratti, and certification filters to shortlist relevant stones before consultation.'),
    ],
    faqs: [
      { question: 'Can I choose a planet gemstone only by rashi?', answer: 'Rashi can be a starting point, but proper gemstone guidance should review the wider chart and personal context.' },
    ],
  },
];

export function getFallbackKnowledgeArticle(slug: string) {
  return FALLBACK_KNOWLEDGE_ARTICLES.find((article) => article.slug.current === slug) ?? null;
}