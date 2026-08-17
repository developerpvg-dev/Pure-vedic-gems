export type BlogEnrichment = {
  faqs: Array<{ question: string; answer: string }>;
  relatedProductCategoryHref: string;
  relatedProductCategoryLabel: string;
};

// ponytail: preserves useful sections on the two audited posts until editors save the same fields in Sanity.
const AUDIT_POST_ENRICHMENT: Record<string, BlogEnrichment> = {
  'untreated-emerald-for-astrology-panna-stone-benefits-price-buying-guide': {
    relatedProductCategoryHref: '/gemstones/navaratna/emerald',
    relatedProductCategoryLabel: 'Natural Emerald (Panna)',
    faqs: [
      {
        question: 'What is an untreated emerald?',
        answer: 'An untreated emerald has not undergone a treatment intended to change its colour or clarity. Always review the laboratory report for the treatment disclosure of the specific stone.',
      },
      {
        question: 'How can I verify a natural Panna stone?',
        answer: 'Buy from a seller that provides a recognised laboratory certificate, clear treatment disclosure, product photographs, weight, origin details where available, and a return policy.',
      },
      {
        question: 'Should I wear an emerald for astrology?',
        answer: 'Gemstone recommendations are personal in Vedic astrology. Consult a qualified astrologer or gemologist before selecting a stone, weight, metal, and wearing method.',
      },
    ],
  },
  'natural-untreated-pukhraj-gemstone-for-astrology-buying-guide': {
    relatedProductCategoryHref: '/gemstones/navaratna/yellow-sapphire',
    relatedProductCategoryLabel: 'Natural Yellow Sapphire (Pukhraj)',
    faqs: [
      {
        question: 'What is an untreated Pukhraj stone?',
        answer: 'An untreated Pukhraj is a yellow sapphire that has not received a treatment intended to alter its colour or clarity. Confirm the treatment disclosure on the certificate for the individual stone.',
      },
      {
        question: 'What should I check before buying yellow sapphire?',
        answer: 'Review the laboratory certificate, treatment disclosure, weight, colour, clarity, origin details where available, price, and the seller’s return policy before making a decision.',
      },
      {
        question: 'Can anyone wear yellow sapphire?',
        answer: 'No single gemstone suits everyone. For astrological use, seek personalised guidance before selecting a yellow sapphire or deciding how to wear it.',
      },
    ],
  },
};

export function auditedBlogEnrichment(slug: string): BlogEnrichment | undefined {
  return AUDIT_POST_ENRICHMENT[slug];
}
